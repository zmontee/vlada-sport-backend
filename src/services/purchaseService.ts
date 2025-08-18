import courseRepository from '@/repositories/courseRepository';
import purchaseRepository from '@/repositories/purchaseRepository';
import paymentRepository from '@/repositories/paymentRepository';
import monobankService from '@/services/monobankService';
import createHttpError from 'http-errors';

interface CreatePaymentParams {
  userId: number;
  courseIds: number[];
}

interface PurchaseCoursesParams {
  userId: number;
  courseIds: number[];
  paymentMethod?: string;
  paymentId?: string;
}

class PurchaseService {
  // Створення платежу (існуючий метод без змін)
  async createPayment(params: CreatePaymentParams) {
    const { userId, courseIds } = params;

    // Перевірити існування курсів та отримати їх ціни
    const courses = await courseRepository.findManyByIds(courseIds);

    if (courses.length !== courseIds.length) {
      const foundIds = courses.map(course => course.id);
      const notFoundIds = courseIds.filter(id => !foundIds.includes(id));
      throw createHttpError(
        404,
        `Courses not found: ${notFoundIds.join(', ')}`
      );
    }

    // Перевірити, чи користувач не купував ці курси раніше
    const existingPurchases = await purchaseRepository.findUserPurchases(
      userId,
      courseIds
    );

    if (existingPurchases.length > 0) {
      const alreadyPurchasedIds = existingPurchases.map(p => p.courseId);
      throw createHttpError(
        400,
        `User has already purchased courses: ${alreadyPurchasedIds.join(', ')}`
      );
    }

    // Розрахувати загальну суму
    const totalAmount = courses.reduce((sum, course) => sum + course.price, 0);
    const amountInKopiyky = Math.round(totalAmount * 100); // конвертувати в копійки

    // Створити інвойс у Monobank
    const invoice = await monobankService.createInvoice({
      // amount: amountInKopiyky,
      amount: 100,
      ccy: 980, // гривня
      merchantPaymInfo: {
        reference: `courses-${userId}-${Date.now()}`,
        destination: `Покупка курсів: ${courses.map(c => c.title).join(', ')}`,
        comment: `Оплата за ${courses.length} курс(ів)`,
        basketOrder: courses.map(course => ({
          name: course.title,
          qty: 1,
          sum: Math.round(course.price * 100), // в копійках
          total: Math.round(course.price * 100),
          unit: 'курс',
          code: course.id.toString(),
        })),
      },
      redirectUrl: `${process.env.FRONTEND_URL}/profile`,
      webHookUrl: `${process.env.API_BASE_URL}/payments/webhook`,
      validity: 3600, // 1 година
      paymentType: 'debit',
    });

    // Зберегти інформацію про платіж у базі даних
    await paymentRepository.createPayment({
      userId,
      courseIds,
      amount: totalAmount,
      invoiceId: invoice.invoiceId,
      status: 'created',
    });

    return {
      invoiceId: invoice.invoiceId,
      paymentUrl: invoice.pageUrl,
      amount: totalAmount,
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        price: course.price,
      })),
    };
  }

  async getPaymentStatus(invoiceId: string, userId: number) {
    // Спочатку знаходимо платіж у нашій базі даних
    const payment = await paymentRepository.findUserPaymentByInvoiceId(
      invoiceId,
      userId
    );

    if (!payment) {
      throw createHttpError(404, 'Payment not found');
    }

    // Якщо платіж ще не завершений, перевіряємо статус у Monobank
    if (payment.status === 'created' || payment.status === 'processing') {
      try {
        const monobankStatus =
          await monobankService.getInvoiceStatus(invoiceId);

        // Перевіряємо modifiedDate перед оновленням
        const shouldUpdate =
          !payment.modifiedDate ||
          new Date(monobankStatus.modifiedDate) > payment.modifiedDate;

        if (shouldUpdate && monobankStatus.status !== payment.status) {
          await paymentRepository.updatePaymentStatusSafe({
            invoiceId,
            status: monobankStatus.status,
            paymentId: monobankStatus.paymentId,
            modifiedDate: monobankStatus.modifiedDate,
          });

          // Якщо платіж успішний, створюємо покупки
          if (monobankStatus.status === 'success') {
            await this.purchaseCourses({
              userId: payment.userId,
              courseIds: payment.courseIds,
              paymentMethod: 'monobank',
              paymentId: monobankStatus.paymentId || invoiceId,
            });
          }

          return {
            invoiceId: payment.invoiceId,
            status: monobankStatus.status,
            amount: payment.amount,
            courseIds: payment.courseIds,
            modifiedDate: monobankStatus.modifiedDate,
            createdAt: payment.createdAt,
            updatedAt: new Date(),
          };
        }
      } catch (error) {
        console.error('Error checking Monobank status:', error);
        // Якщо не можемо отримати статус від Monobank, повертаємо наш статус
      }
    }

    return {
      invoiceId: payment.invoiceId,
      status: payment.status,
      amount: payment.amount,
      courseIds: payment.courseIds,
      modifiedDate: payment.modifiedDate?.toISOString(),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  // Оновлена обробка webhook від Monobank з перевіркою modifiedDate
  async processWebhook(webhookData: any) {
    const { invoiceId, status, modifiedDate, paymentId } = webhookData;

    console.log(
      `Processing webhook for invoice ${invoiceId}, status: ${status}, modifiedDate: ${modifiedDate}`
    );

    // Знайти платіж у базі даних
    const payment = await paymentRepository.findByInvoiceId(invoiceId);

    if (!payment) {
      console.error(`Payment not found for invoice ${invoiceId}`);
      throw createHttpError(404, 'Payment not found');
    }

    try {
      // Використовуємо безпечний метод оновлення з перевіркою modifiedDate
      const updatedPayment = await paymentRepository.updatePaymentStatusSafe({
        invoiceId,
        status,
        paymentId,
        modifiedDate,
      });

      console.log(`Payment status updated for invoice ${invoiceId}: ${status}`);

      // Якщо платіж успішний і ми дійсно оновили статус, створити покупки курсів
      if (status === 'success') {
        // Перевіряємо, чи користувач ще не має цих курсів
        const existingPurchases = await purchaseRepository.findUserPurchases(
          payment.userId,
          payment.courseIds
        );

        if (existingPurchases.length === 0) {
          console.log(`Creating course purchases for user ${payment.userId}`);
          await this.purchaseCourses({
            userId: payment.userId,
            courseIds: payment.courseIds,
            paymentMethod: 'monobank',
            paymentId: paymentId || invoiceId,
          });
        } else {
          console.log(
            `Courses already purchased for user ${payment.userId}, skipping`
          );
        }
      }

      return { success: true, status, modifiedDate };
    } catch (error: any) {
      if (error.message.includes('older modifiedDate')) {
        // Це нормально - просто отримали старший webhook
        console.log(`Ignoring older webhook for invoice ${invoiceId}`);
        return { success: true, status: 'ignored', reason: 'older_webhook' };
      }
      throw error;
    }
  }

  // Існуючий метод для створення покупок (без змін)
  async purchaseCourses(params: PurchaseCoursesParams) {
    const { userId, courseIds, paymentMethod, paymentId } = params;

    // Перевірити існування курсів
    const courses = await courseRepository.findManyByIds(courseIds);

    if (courses.length !== courseIds.length) {
      const foundIds = courses.map(course => course.id);
      const notFoundIds = courseIds.filter(id => !foundIds.includes(id));
      throw createHttpError(
        404,
        `Courses not found: ${notFoundIds.join(', ')}`
      );
    }

    // Перевірити існуючі покупки
    const existingPurchases = await purchaseRepository.findUserPurchases(
      userId,
      courseIds
    );

    if (existingPurchases.length > 0) {
      const alreadyPurchasedIds = existingPurchases.map(p => p.courseId);
      throw createHttpError(
        400,
        `User has already purchased courses: ${alreadyPurchasedIds.join(', ')}`
      );
    }

    // Створити записи про покупки
    const purchases = await Promise.all(
      courses.map(course => {
        return purchaseRepository.createPurchase({
          userId,
          courseId: course.id,
          amount: course.price,
          paymentMethod,
          paymentId,
        });
      })
    );

    // Ініціалізувати прогрес курсів
    await Promise.all(
      courses.map(course => {
        return purchaseRepository.initializeCourseProgress(userId, course.id);
      })
    );

    return purchases;
  }
}

const purchaseService = new PurchaseService();
export default purchaseService;
