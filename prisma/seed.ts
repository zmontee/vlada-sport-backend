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

  console.log('Створення курсу 1...');
  const course1 = await createCourse1();

  const course2 = await createCourse2();

  console.log('Створення базового обладнання...');
  const equipmentList = await createBaseEquipment();

  // Отримання ID обладнання для зручності
  const equipmentIds = equipmentList.map(eq => eq.id);

  // Призначаємо деяке обладнання курсу (загальне обладнання)
  await assignEquipmentToCourse(course1.id, [equipmentIds[0], equipmentIds[1]]);

  // Призначаємо деяке обладнання курсу 2 (загальне обладнання)
  await assignEquipmentToCourse(course2.id, [equipmentIds[0], equipmentIds[1]]);

  console.log('Створення модулів і уроків до курсу 1...');
  const modules1 = await createModulesAndLessonsCourse1(course1.id);

  console.log('Створення модулів і уроків до курсу 2...');
  const modules2 = await createModulesAndLessonsCourse2(course2.id);

  console.log('Призначення обладнання модулям курсу 1...');
  // Призначаємо обладнання першому модулю
  await assignEquipmentToModule(modules1[0].id, [equipmentIds[2]]);
  // Призначаємо обладнання другому модулю
  await assignEquipmentToModule(modules1[1].id, [
    equipmentIds[1],
    equipmentIds[3],
  ]);
  // Призначаємо обладнання третьому модулю
  await assignEquipmentToModule(modules1[2].id, [
    equipmentIds[2],
    equipmentIds[3],
  ]);

  console.log('Призначення обладнання модулям курсу 2...');
  await assignEquipmentToModule(modules2[0].id, [equipmentIds[2]]);
  await assignEquipmentToModule(modules2[1].id, [
    equipmentIds[1],
    equipmentIds[3],
  ]);
  await assignEquipmentToModule(modules2[2].id, [
    equipmentIds[2],
    equipmentIds[3],
  ]);

  // Отримуємо перший урок першого модуля і призначаємо йому обладнання
  const firstLesson1 = await prisma.lesson.findFirst({
    where: {
      moduleId: modules1[0].id,
      orderIndex: 1,
    },
  });
  if (firstLesson1) {
    await assignEquipmentToLesson(firstLesson1.id, [equipmentIds[0]]);
  }

  // Отримуємо другий урок другого модуля і призначаємо йому обладнання
  const secondModuleSecondLesson1 = await prisma.lesson.findFirst({
    where: {
      moduleId: modules1[1].id,
      orderIndex: 2,
    },
  });
  if (secondModuleSecondLesson1) {
    await assignEquipmentToLesson(secondModuleSecondLesson1.id, [
      equipmentIds[1],
      equipmentIds[2],
    ]);
  }

  const firstLesson2 = await prisma.lesson.findFirst({
    where: {
      moduleId: modules1[1].id,
      orderIndex: 1,
    },
  });
  if (firstLesson2) {
    await assignEquipmentToLesson(firstLesson2.id, [equipmentIds[0]]);
  }

  console.log('Створення бенефітів...');
  const benefits = await createBenefits();

  // Призначаємо бенефіти курсу
  const benefitIds = benefits.map(benefit => benefit.id);

  await assignBenefitsToCourse(course1.id, benefitIds);

  await assignBenefitsToCourse(course2.id, benefitIds);

  console.log('Додавання демо-відгуку...');
  await createReview(adminUser.id, course1.id);

  console.log('Створення покупки курсу для адміністратора...');
  await createPurchase(adminUser.id, course1.id);

  console.log('Ініціалізацію завершено успішно!');
}

async function cleanDatabase() {
  const tableNames = [
    'LessonEquipment',
    'ModuleEquipment',
    'CourseEquipment',
    'CourseBenefits',
    'LessonProgress',
    'ModuleProgress',
    'CourseProgress',
    'Purchase',
    'Review',
    'Lesson',
    'Module',
    'Equipment',
    'Benefit',
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
      phoneNumber: '+380967223163',
      sex: 'чоловіча',
      birthDate: '1998-12-13',
      experience: 'професійний',
      weight: 75.5,
      imageUrl: '/cdn/images/sport-admin.jpg',
      role: UserRole.ADMIN,
    },
  });
}

async function createCourse1() {
  return await prisma.course.create({
    data: {
      title: 'Функціональний рух і пілатес',
      description: `Цей унікальний курс поєднує функціональні вправи та пілатес, спрямовані на 
        реабілітацію, мобілізацію суглобів і глибоке відчуття м’язів. Наші заняття допоможуть
        вам не лише відновити тіло, а й розвинути усвідомленість рухів, досягаючи гармонії між
        фізичним та ментальним станом.`,
      additionalDescription:
        'Цей курс створений для тих, хто прагне досягти видимих результатів у короткі терміни та покращити загальний фізичний стан. Завдяки поєднанню силових і кардіотренувань ви зможете підвищити витривалість, покращити тонус м’язів і відчути справжню енергію вже після кількох тижнів занять',
      targetAudience: [
        'Новачки',
        'Зайняті люди',
        'Мотивовані',
        'Після перерви',
        'Зміцнення',
      ],
      level: 'Новачок',
      duration: '1.5 місяці',
      price: 1500,
      imageUrl: '/cdn/images/course-1.jpg',
    },
  });
}

async function createCourse2() {
  return await prisma.course.create({
    data: {
      title: 'НейроФіт: Гнучка сила та внутрішня опора',
      description: `Цей динамічний курс поєднує функціональні нейровправи,
гнучку силу та координацію, допомагаючи вам розвинути
гарний м’язовий тонус і рельєф без надзусиль. Це не
просто тренування — це швидкий, захопливий рух, схожий
на танець, що активізує не тільки тіло, а й внутрішню енергію.
`,
      additionalDescription:
        'Відчуйте, як ваше тіло стає сильним, гнучким та граційним, рухаючись легко та природно!',
      targetAudience: [
        'Новачки',
        'Зайняті люди',
        'Мотивовані',
        'Після перерви',
        'Зміцнення',
      ],
      level: 'Середній',
      duration: '1.5 місяці',
      price: 1500,
      imageUrl: '/cdn/images/course-2.jpg',
    },
  });
}

async function createModulesAndLessonsCourse1(courseId: number) {
  // Модуль 1: Швидкий старт
  const module1 = await prisma.module.create({
    data: {
      title: 'Ідеальний старт',
      description:
        'Основи силових тренувань та балансу. Цей модуль допоможе вам розпочати шлях до кращої фізичної форми.',
      imageUrl: '/cdn/images/module-demo.jpg',
      orderIndex: 1,
      courseId,
    },
  });

  // Уроки для модуля 1
  await prisma.lesson.create({
    data: {
      title: 'Вступне заняття',
      description:
        'Ознайомлення з програмою курсу, базовими концепціями та необхідним інвентарем.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
      duration: 600, // 10 хвилин
      orderIndex: 1,
      moduleId: module1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Базова розминка',
      description: 'Комплекс вправ для розминки перед основним тренуванням.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
      duration: 900, // 15 хвилин
      orderIndex: 2,
      moduleId: module1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Перше тренування',
      description: 'Базові вправи для розвитку сили та балансу.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
      duration: 1800, // 30 хвилин
      orderIndex: 3,
      moduleId: module1.id,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      title: 'Сила та витривалість',
      description:
        "Розвиток сили основних груп м'язів за допомогою власної ваги та спеціальних вправ.",
      imageUrl: '/cdn/images/module-demo.jpg',
      orderIndex: 2,
      courseId,
    },
  });

  // Уроки для модуля 2
  await prisma.lesson.create({
    data: {
      title: 'Верхня частина тіла',
      description: 'Комплекс вправ для розвитку сили рук, грудей та спини.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
      duration: 2400, // 40 хвилин
      orderIndex: 1,
      moduleId: module2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Нижня частина тіла',
      description: 'Комплекс вправ для розвитку сили ніг та сідниць.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
      duration: 2400, // 40 хвилин
      orderIndex: 2,
      moduleId: module2.id,
    },
  });

  // Модуль 3: Баланс і координація
  const module3 = await prisma.module.create({
    data: {
      title: 'Баланс і гармонія',
      description:
        'Покращення рівноваги та координації рухів за допомогою спеціальних вправ.',
      orderIndex: 3,
      imageUrl: '/cdn/images/module-demo.jpg',
      courseId,
    },
  });

  // Уроки для модуля 3
  await prisma.lesson.create({
    data: {
      title: 'Основи балансу',
      description: 'Базові вправи для покращення рівноваги тіла.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
      duration: 1800, // 30 хвилин
      orderIndex: 1,
      moduleId: module3.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Координаційні вправи',
      description: 'Комплекс вправ для покращення координації рухів.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
      duration: 1800, // 30 хвилин
      orderIndex: 2,
      moduleId: module3.id,
    },
  });

  // Модуль 4: Підсумки і планування
  const module4 = await prisma.module.create({
    data: {
      title: 'Рельєф і тонус',
      description:
        'Закріплення отриманих навичок та планування подальших тренувань.',
      orderIndex: 4,
      imageUrl: '/cdn/images/module-demo.jpg',
      courseId,
    },
  });

  // Уроки для модуля 4
  await prisma.lesson.create({
    data: {
      title: 'Комплексне тренування',
      description: "Тренування, яке об'єднує всі вивчені вправи.",
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
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
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/module-demo.jpg',
      duration: 1200, // 20 хвилин
      orderIndex: 2,
      moduleId: module4.id,
    },
  });

  return [module1, module2, module3, module4];
}

async function createModulesAndLessonsCourse2(courseId: number) {
  // Модуль 1: Вступ до НейроФіт
  const module1 = await prisma.module.create({
    data: {
      title: 'Вступ до НейроФіт',
      description:
        'Знайомство з основами нейрофункціонального тренування та підготовка до курсу.',
      imageUrl: '/cdn/images/neurofit-module1.jpg',
      orderIndex: 1,
      courseId,
    },
  });

  // Уроки для модуля 1
  await prisma.lesson.create({
    data: {
      title: 'Філософія НейроФіт',
      description:
        'Основні принципи тренувань, ключові концепції та вхідна діагностика.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/neurofit-lesson1.jpg',
      duration: 1200, // 20 хвилин
      orderIndex: 1,
      moduleId: module1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Базові нейрорухи',
      description:
        'Основні шаблони рухів та елементи, які будуть використовуватись протягом курсу.',
      videoUrl: 'https://vimeo.com/1084734911/a21691f716',
      imageUrl: '/cdn/images/neurofit-lesson2.jpg',
      duration: 1800, // 30 хвилин
      orderIndex: 2,
      moduleId: module1.id,
    },
  });

  // Модуль 2: Гнучка сила
  const module2 = await prisma.module.create({
    data: {
      title: 'Гнучка сила',
      description:
        "Розвиток пластичності м'язів у поєднанні з контрольованою силою.",
      imageUrl: '/cdn/images/neurofit-module2.jpg',
      orderIndex: 2,
      courseId,
    },
  });

  // Уроки для модуля 2
  await prisma.lesson.create({
    data: {
      title: 'Динамічна мобілізація',
      description: 'Комплекс вправ для розвитку мобільності основних суглобів.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/neurofit-lesson3.jpg',
      duration: 2400, // 40 хвилин
      orderIndex: 1,
      moduleId: module2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Інтегровані шаблони руху',
      description:
        "Складні рухові патерни, що задіюють багато м'язових груп одночасно.",
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/neurofit-lesson4.jpg',
      duration: 2700, // 45 хвилин
      orderIndex: 2,
      moduleId: module2.id,
    },
  });

  // Модуль 3: Внутрішня опора
  const module3 = await prisma.module.create({
    data: {
      title: 'Внутрішня опора',
      description:
        "Розвиток глибоких м'язів-стабілізаторів та правильної постави.",
      imageUrl: '/cdn/images/neurofit-module3.jpg',
      orderIndex: 3,
      courseId,
    },
  });

  // Уроки для модуля 3
  await prisma.lesson.create({
    data: {
      title: 'Ядро стабільності',
      description:
        "Вправи для зміцнення м'язів кора та глибоких стабілізаторів.",
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/neurofit-lesson5.jpg',
      duration: 2100, // 35 хвилин
      orderIndex: 1,
      moduleId: module3.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Ідеальна постава',
      description:
        'Техніки для відновлення та підтримки правильного положення тіла.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/neurofit-lesson6.jpg',
      duration: 1800, // 30 хвилин
      orderIndex: 2,
      moduleId: module3.id,
    },
  });

  // Модуль 4: Нейрокоординація
  const module4 = await prisma.module.create({
    data: {
      title: 'Нейрокоординація',
      description:
        'Вдосконалення координації та балансу через складні рухові патерни.',
      imageUrl: '/cdn/images/neurofit-module4.jpg',
      orderIndex: 4,
      courseId,
    },
  });

  // Уроки для модуля 4
  await prisma.lesson.create({
    data: {
      title: 'Складні балансові вправи',
      description:
        'Тренування рівноваги та пропріоцепції через нестандартні рухи.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/neurofit-lesson7.jpg',
      duration: 2400, // 40 хвилин
      orderIndex: 1,
      moduleId: module4.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Комплексне тренування',
      description:
        'Фінальне тренування, що поєднує всі елементи курсу в єдину динамічну послідовність.',
      videoUrl: 'https://vimeo.com/1084741444/b724d62f01',
      imageUrl: '/cdn/images/neurofit-lesson8.jpg',
      duration: 3600, // 60 хвилин
      orderIndex: 2,
      moduleId: module4.id,
    },
  });

  return [module1, module2, module3, module4];
}

async function createBaseEquipment() {
  console.log('Створення базового набору обладнання...');

  const equipmentItems = [
    {
      name: 'Гантелі',
      description: 'Гантелі',
      imageUrl: '/cdn/images/equip-1.png',
    },
    {
      name: 'Скакалка',
      description: 'Скакалка',
      imageUrl: '/cdn/images/equip-2.png',
    },
    {
      name: 'Килимок',
      description: 'Килимок',
      imageUrl: '/cdn/images/equip-3.png',
    },
    {
      name: 'Ролл',
      description: 'Ролл',
      imageUrl: '/cdn/images/equip-4.png',
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
        course: {
          connect: { id: courseId },
        },
        equipment: {
          connect: { id: equipmentId },
        },
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
        module: {
          connect: { id: moduleId },
        },
        equipment: {
          connect: { id: equipmentId },
        },
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
        lesson: {
          connect: { id: lessonId },
        },
        equipment: {
          connect: { id: equipmentId },
        },
        quantity: 1,
        notes,
      },
    });
  }
}

async function createBenefits() {
  console.log('Створення базового набору бенефітів...');

  const benefitItems = [
    {
      name: 'Результат',
      description: 'Видимі зміни у вашій фізичній формі та самопочутті',
      imageUrl: 'test',
    },
    {
      name: 'Мотивація',
      description:
        'Постійна підтримка, що допоможе не зупинятися на шляху до мети',
      imageUrl: 'test',
    },
    {
      name: 'Знання',
      description:
        'Правильна техніка виконання вправ та основи здорового способу життя',
      imageUrl: 'test',
    },
    {
      name: 'Енергія',
      description: 'Заряд бадьорості та впевненості після кожного тренування',
      imageUrl: 'test',
    },
  ];

  const createdBenefits = [];

  for (const item of benefitItems) {
    const benefit = await prisma.benefit.create({
      data: item,
    });
    createdBenefits.push(benefit);
  }

  return createdBenefits;
}

// Функція для призначення бенефітів курсу
async function assignBenefitsToCourse(courseId: number, benefitIds: number[]) {
  console.log('Призначення обладнання для курсу...');

  for (const benefitId of benefitIds) {
    await prisma.courseBenefits.create({
      data: {
        course: {
          connect: { id: courseId },
        },
        benefit: {
          connect: { id: benefitId },
        },
      },
    });
  }
}

async function createReview(userId: number, courseId: number) {
  await prisma.review.create({
    data: {
      rating: 5,
      comment:
        'Тут усе — з такою любов’ю! Тренування м’які, але ефективні, після них я не валяюсь без сил, а навпаки — відчуваю легкість і радість. Нарешті зникло відчуття, що я “щось винна” своєму тілу.',
      userId,
      courseId,
    },
  });
}

async function createPurchase(userId: number, courseId: number) {
  // Створюємо покупку
  await prisma.purchase.create({
    data: {
      amount: 1500,
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
