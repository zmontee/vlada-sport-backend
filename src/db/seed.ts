import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Очищаємо базу даних перед заповненням (опціонально)
  // Якщо ви не хочете очищати дані, закоментуйте цей код
  console.log('Очищення існуючих даних...');
  await cleanDatabase();

  console.log('Створення користувача...');
  const adminUser = await createAdminUser();

  console.log('Створення курсу...');
  const course = await createCourse();

  console.log('Створення базового обладнання...');
  const equipmentList = await createBaseEquipment();

  // Отримання ID обладнання для зручності
  const equipmentIds = equipmentList.map(eq => eq.id);

  // Призначаємо деяке обладнання курсу (загальне обладнання)
  await assignEquipmentToCourse(course.id, [equipmentIds[0], equipmentIds[1]]); // килимок та гантелі

  console.log('Створення модулів і уроків...');
  const modules = await createModulesAndLessons(course.id);

  // Призначаємо обладнання першому модулю
  await assignEquipmentToModule(modules[0].id, [equipmentIds[2]]); // фітнес-резинки

  // Призначаємо обладнання другому модулю
  await assignEquipmentToModule(modules[1].id, [
    equipmentIds[1],
    equipmentIds[4],
  ]);

  // Призначаємо обладнання третьому модулю
  await assignEquipmentToModule(modules[2].id, [
    equipmentIds[3],
    equipmentIds[5],
  ]);

  // Отримуємо перший урок першого модуля і призначаємо йому обладнання
  const firstLesson = await prisma.lesson.findFirst({
    where: {
      moduleId: modules[0].id,
      orderIndex: 1,
    },
  });

  if (firstLesson) {
    await assignEquipmentToLesson(firstLesson.id, [equipmentIds[0]]);
  }

  // Отримуємо другий урок другого модуля і призначаємо йому обладнання
  const secondModuleSecondLesson = await prisma.lesson.findFirst({
    where: {
      moduleId: modules[1].id,
      orderIndex: 2,
    },
  });

  if (secondModuleSecondLesson) {
    await assignEquipmentToLesson(secondModuleSecondLesson.id, [
      equipmentIds[1],
      equipmentIds[5],
    ]);
  }

  console.log('Додавання демо-відгуку...');
  await createReview(adminUser.id, course.id);

  console.log('Створення покупки курсу для адміністратора...');
  await createPurchase(adminUser.id, course.id);

  console.log('Ініціалізацію завершено успішно!');
}

async function cleanDatabase() {
  const tableNames = [
    'LessonProgress',
    'ModuleProgress',
    'CourseProgress',
    'Purchase',
    'Review',
    'CourseEquipment',
    'Lesson',
    'Module',
    'Course',
    'RefreshToken',
    'OAuthAccount',
    'User',
  ];

  for (const table of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`);
    } catch (error) {
      console.log(`Помилка при очищенні таблиці ${table}:`, error);
    }
  }
}

async function createAdminUser() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  return await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      name: 'Адміністратор',
      surname: 'Системи',
      phoneNumber: '+380991234567',
      sex: 'чоловіча',
      birthDate: '1990-01-01',
      experience: 'професійний',
      weight: 75.5,
      imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      role: UserRole.ADMIN,
    },
  });
}

async function createCourse() {
  return await prisma.course.create({
    data: {
      title: 'Сила і баланс',
      description:
        'Цей курс ідеально підходить для тих, хто хоче зміцнити своє тіло, поліпшити координацію та знайти внутрішній баланс. Силові вправи в поєднанні з розтяжкою й функціональними тренуваннями допоможуть вам досягти відчуття гармонії та впевненості в собі',
      additionalDescription:
        'Цей курс створений для тих, хто прагне досягти видимих результатів у короткі терміни та покращити загальний фізичний стан. Завдяки поєднанню силових і кардіотренувань ви зможете підвищити витривалість, покращити тонус м’язів і відчути справжню енергію вже після кількох тижнів занять',
      targetAudience: [
        'Новачки',
        'Зайняті люди',
        'Мотивовані',
        'Після перерви',
        'Зміцнення',
      ],
      duration: '4 тижні',
      price: 999.99,
      imageUrl: 'https://example.com/images/strength-balance-course.jpg',
    },
  });
}

async function createModulesAndLessons(courseId: number) {
  // Модуль 1: Швидкий старт
  const module1 = await prisma.module.create({
    data: {
      title: 'Швидкий старт',
      description:
        'Основи силових тренувань та балансу. Цей модуль допоможе вам розпочати шлях до кращої фізичної форми.',
      orderIndex: 1,
      courseId,
    },
  });

  // Уроки для модуля 1
  await prisma.lesson.create({
    data: {
      title: 'Вступ до курсу',
      description:
        'Ознайомлення з програмою курсу, базовими концепціями та необхідним інвентарем.',
      videoUrl: 'https://example.com/videos/intro.mp4',
      duration: 600, // 10 хвилин
      orderIndex: 1,
      moduleId: module1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Базова розминка',
      description: 'Комплекс вправ для розминки перед основним тренуванням.',
      videoUrl: 'https://example.com/videos/warm-up.mp4',
      duration: 900, // 15 хвилин
      orderIndex: 2,
      moduleId: module1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Перше тренування',
      description: 'Базові вправи для розвитку сили та балансу.',
      videoUrl: 'https://example.com/videos/first-training.mp4',
      duration: 1800, // 30 хвилин
      orderIndex: 3,
      moduleId: module1.id,
    },
  });

  // Модуль 2: Сила тіла
  const module2 = await prisma.module.create({
    data: {
      title: 'Сила тіла',
      description:
        "Розвиток сили основних груп м'язів за допомогою власної ваги та спеціальних вправ.",
      orderIndex: 2,
      courseId,
    },
  });

  // Уроки для модуля 2
  await prisma.lesson.create({
    data: {
      title: 'Верхня частина тіла',
      description: 'Комплекс вправ для розвитку сили рук, грудей та спини.',
      videoUrl: 'https://example.com/videos/upper-body.mp4',
      duration: 2400, // 40 хвилин
      orderIndex: 1,
      moduleId: module2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Нижня частина тіла',
      description: 'Комплекс вправ для розвитку сили ніг та сідниць.',
      videoUrl: 'https://example.com/videos/lower-body.mp4',
      duration: 2400, // 40 хвилин
      orderIndex: 2,
      moduleId: module2.id,
    },
  });

  // Модуль 3: Баланс і координація
  const module3 = await prisma.module.create({
    data: {
      title: 'Баланс і координація',
      description:
        'Покращення рівноваги та координації рухів за допомогою спеціальних вправ.',
      orderIndex: 3,
      courseId,
    },
  });

  // Уроки для модуля 3
  await prisma.lesson.create({
    data: {
      title: 'Основи балансу',
      description: 'Базові вправи для покращення рівноваги тіла.',
      videoUrl: 'https://example.com/videos/balance-basics.mp4',
      duration: 1800, // 30 хвилин
      orderIndex: 1,
      moduleId: module3.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Координаційні вправи',
      description: 'Комплекс вправ для покращення координації рухів.',
      videoUrl: 'https://example.com/videos/coordination.mp4',
      duration: 1800, // 30 хвилин
      orderIndex: 2,
      moduleId: module3.id,
    },
  });

  // Модуль 4: Підсумки і планування
  const module4 = await prisma.module.create({
    data: {
      title: 'Підсумки і планування',
      description:
        'Закріплення отриманих навичок та планування подальших тренувань.',
      orderIndex: 4,
      courseId,
    },
  });

  // Уроки для модуля 4
  await prisma.lesson.create({
    data: {
      title: 'Комплексне тренування',
      description: "Тренування, яке об'єднує всі вивчені вправи.",
      videoUrl: 'https://example.com/videos/complex-workout.mp4',
      duration: 3600, // 60 хвилин
      orderIndex: 1,
      moduleId: module4.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Підсумки курсу',
      description:
        'Підведення підсумків курсу та рекомендації щодо подальших тренувань.',
      videoUrl: 'https://example.com/videos/summary.mp4',
      duration: 1200, // 20 хвилин
      orderIndex: 2,
      moduleId: module4.id,
    },
  });

  return [module1, module2, module3, module4];
}

// async function createEquipment(courseId: number) {
//   const equipment = [
//     {
//       name: 'Килимок для йоги',
//       description: 'Зручний килимок для виконання вправ на підлозі.',
//       imageUrl: 'https://example.com/images/yoga-mat.jpg',
//     },
//     {
//       name: 'Гантелі',
//       description: 'Пара гантелей (2-5 кг) для силових вправ.',
//       imageUrl: 'https://example.com/images/dumbbells.jpg',
//     },
//     {
//       name: 'Фітнес-резинки',
//       description:
//         "Набір резинок різної жорсткості для тренування різних груп м'язів.",
//       imageUrl: 'https://example.com/images/resistance-bands.jpg',
//     },
//     {
//       name: 'Балансувальна подушка',
//       description: 'Спеціальна подушка для вправ на баланс і координацію.',
//       imageUrl: 'https://example.com/images/balance-pad.jpg',
//     },
//   ];
//
//   for (const item of equipment) {
//     await prisma.courseEquipment.create({
//       data: {
//         ...item,
//         courseId,
//       },
//     });
//   }
// }

// Функція для створення базового обладнання в базі даних
async function createBaseEquipment() {
  console.log('Створення базового набору обладнання...');

  const equipmentItems = [
    {
      name: 'Килимок для йоги',
      description: 'Зручний килимок для виконання вправ на підлозі.',
      imageUrl: 'https://example.com/images/yoga-mat.jpg',
    },
    {
      name: 'Гантелі',
      description: 'Пара гантелей (2-5 кг) для силових вправ.',
      imageUrl: 'https://example.com/images/dumbbells.jpg',
    },
    {
      name: 'Фітнес-резинки',
      description:
        "Набір резинок різної жорсткості для тренування різних груп м'язів.",
      imageUrl: 'https://example.com/images/resistance-bands.jpg',
    },
    {
      name: 'Балансувальна подушка',
      description: 'Спеціальна подушка для вправ на баланс і координацію.',
      imageUrl: 'https://example.com/images/balance-pad.jpg',
    },
    {
      name: 'Скакалка',
      description: 'Для кардіо вправ та розминки.',
      imageUrl: 'https://example.com/images/jump-rope.jpg',
    },
    {
      name: 'Медбол',
      description: "М'яч з вагою для функціональних тренувань.",
      imageUrl: 'https://example.com/images/medicine-ball.jpg',
    },
  ];

  const createdEquipment = [];

  for (const item of equipmentItems) {
    const equipment = await prisma.equipment.create({
      data: item,
    });
    createdEquipment.push(equipment);
  }

  return createdEquipment;
}

// Функція для призначення обладнання курсу
async function assignEquipmentToCourse(
  courseId: number,
  equipmentIds: number[],
  notes: string = 'Необхідно для всього курсу'
) {
  console.log('Призначення обладнання для курсу...');

  for (const equipmentId of equipmentIds) {
    await prisma.courseEquipment.create({
      data: {
        courseId,
        equipmentId,
        quantity: 1,
        notes,
      },
    });
  }
}

// Функція для призначення обладнання модулю
async function assignEquipmentToModule(
  moduleId: number,
  equipmentIds: number[],
  notes: string = 'Необхідно для даного модуля'
) {
  console.log(`Призначення обладнання для модуля ID ${moduleId}...`);

  for (const equipmentId of equipmentIds) {
    await prisma.moduleEquipment.create({
      data: {
        moduleId,
        equipmentId,
        quantity: 1,
        notes,
      },
    });
  }
}

// Функція для призначення обладнання уроку
async function assignEquipmentToLesson(
  lessonId: number,
  equipmentIds: number[],
  notes: string = 'Необхідно для даного уроку'
) {
  console.log(`Призначення обладнання для уроку ID ${lessonId}...`);

  for (const equipmentId of equipmentIds) {
    await prisma.lessonEquipment.create({
      data: {
        lessonId,
        equipmentId,
        quantity: 1,
        notes,
      },
    });
  }
}

async function createReview(userId: number, courseId: number) {
  await prisma.review.create({
    data: {
      rating: 5,
      comment:
        'Чудовий курс! Після його проходження відчуваю себе значно сильнішим та впевненішим. Рекомендую всім!',
      userId,
      courseId,
    },
  });
}

async function createPurchase(userId: number, courseId: number) {
  // Створюємо покупку
  await prisma.purchase.create({
    data: {
      amount: 999.99,
      paymentMethod: 'Банківська карта',
      paymentId: 'DEMO-PAYMENT-123',
      userId,
      courseId,
    },
  });

  // Створюємо початковий прогрес по курсу
  await prisma.courseProgress.create({
    data: {
      progressPercent: 0,
      userId,
      courseId,
    },
  });
}

main()
  .catch(e => {
    console.error('Помилка під час ініціалізації даних:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
