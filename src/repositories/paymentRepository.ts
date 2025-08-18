import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePaymentParams {
  userId: number;
  courseIds: number[];
  amount: number;
  invoiceId: string;
  status: string;
}

export interface UpdatePaymentStatusParams {
  invoiceId: string;
  status: string;
  paymentId?: string;
  modifiedDate?: string;
}

const paymentRepository = {
  createPayment: async (params: CreatePaymentParams) => {
    const { userId, courseIds, amount, invoiceId, status } = params;

    return prisma.payment.create({
      data: {
        userId,
        courseIds,
        amount,
        invoiceId,
        status,
        createdAt: new Date(),
      },
    });
  },

  findByInvoiceId: async (invoiceId: string) => {
    return prisma.payment.findUnique({
      where: { invoiceId },
    });
  },

  findUserPaymentByInvoiceId: async (invoiceId: string, userId: number) => {
    return prisma.payment.findFirst({
      where: {
        invoiceId,
        userId,
      },
      select: {
        id: true,
        userId: true,
        invoiceId: true,
        status: true,
        amount: true,
        courseIds: true,
        modifiedDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  updatePaymentStatus: async (params: UpdatePaymentStatusParams) => {
    const { invoiceId, status, paymentId, modifiedDate } = params;

    return prisma.payment.update({
      where: { invoiceId },
      data: {
        status,
        paymentId,
        modifiedDate: modifiedDate ? new Date(modifiedDate) : undefined,
        updatedAt: new Date(),
      },
    });
  },

  // Новий метод для безпечного оновлення статусу з перевіркою modifiedDate
  updatePaymentStatusSafe: async (params: UpdatePaymentStatusParams) => {
    const { invoiceId, status, paymentId, modifiedDate } = params;

    if (!modifiedDate) {
      throw new Error('modifiedDate is required for safe update');
    }

    // Отримати поточний платіж
    const currentPayment = await prisma.payment.findUnique({
      where: { invoiceId },
      select: { modifiedDate: true },
    });

    if (!currentPayment) {
      throw new Error('Payment not found');
    }

    // Якщо у нас вже є modifiedDate і новий modifiedDate старіший - ігноруємо оновлення
    if (currentPayment.modifiedDate) {
      const currentModified = new Date(currentPayment.modifiedDate);
      const newModified = new Date(modifiedDate);

      if (newModified <= currentModified) {
        console.log(
          `Webhook ignored: older modifiedDate for invoice ${invoiceId}`
        );
        return currentPayment;
      }
    }

    // Оновлюємо тільки якщо новий modifiedDate пізніший
    return prisma.payment.update({
      where: { invoiceId },
      data: {
        status,
        paymentId,
        modifiedDate: new Date(modifiedDate),
        updatedAt: new Date(),
      },
    });
  },
};

export default paymentRepository;
