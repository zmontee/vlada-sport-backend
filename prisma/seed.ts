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

  console.log('Створення базового обладнання...');
  const equipmentList = await createBaseEquipment();

  // Отримання ID обладнання для зручності
  const equipmentIds = equipmentList.map(eq => eq.id);

  // Призначаємо деяке обладнання курсу (загальне обладнання)
  await assignEquipmentToCourse(course1.id, equipmentIds);

  console.log('Створення модулів і уроків до курсу 1...');
  const modules1 = await createModulesAndLessonsCourse1(course1.id);

  const allLessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: course1.id,
      },
    },
    orderBy: {
      orderIndex: 'asc',
    },
  });

  const lessonEquipmentMap = {
    1: [equipmentIds[0]], // Гантелі (Усе тіло)
    2: [equipmentIds[1]], // Плоский ролл (Гнучкість тазобедренних суглобів)
    3: [equipmentIds[2]], // Резинка дя пілатесу (Мобільність грудного відділу і дихання)
    4: [equipmentIds[3]], // М'яч для пілтесу (Прес і тазове дно)
    5: [equipmentIds[1]], // Плоский ролл (МФР всього тіла)
    6: [], // Функціональне тіло - немає екіпірування
    7: [], // Прес і гнучкість хребта - немає екіпірування
    8: [equipmentIds[0], equipmentIds[4]], // Гантелі, резинка кільцева (Сідниці ноги)
    9: [equipmentIds[5], equipmentIds[6]], // 2 теннісні м'ячі, блок для йоги (МФР і мобільність стегон)
    10: [equipmentIds[0]], // Гантелі (Пілатес на все тіло)
    11: [equipmentIds[1]], // Плоский ролл (Легкість у всьому тілі)
    12: [equipmentIds[1]], // Плоский ролл (Динамічний флоу)
    13: [], // Сила і гнучкість - немає екіпірування
    15: [equipmentIds[1]], // Плоский ролл (Вільна шия і плечі)
    16: [equipmentIds[3]], // М'яч для пілатесу (Внутрішня частина і сідниці)
    17: [equipmentIds[3]], // М'яч для пілатесу (Грудний відділ і хребет)
    19: [equipmentIds[2]], // Резинка для пілатесу (Кісті,руки,шия)
    21: [equipmentIds[1]], // Плоский ролл (Гнучкість тазобедренних)
    22: [equipmentIds[2], equipmentIds[0]], // Резинка для пілатесу, гантелі (Сила спини)
    23: [equipmentIds[3]], // М'яч для пілатесу (Внутрішній кор)
    24: [equipmentIds[0], equipmentIds[3]], // Гантелі, м'яч для пілатесу (Челендж все тіло)
    26: [equipmentIds[0], equipmentIds[3]], // Гантелі, м'яч для пілатесу (Челендж все тіло)
    27: [], // Функціональне флоу - немає екіпірування
  };

  for (const lesson of allLessons) {
    const equipmentForLesson = lessonEquipmentMap[lesson.orderIndex] || [];
    console.log('equipmentForLesson:', equipmentForLesson);
    if (equipmentForLesson.length > 0) {
      await assignEquipmentToLesson(lesson.id, equipmentForLesson);
    }
  }

  console.log('Призначення обладнання модулям курсу 1...');
  await assignEquipmentToModule(modules1[0].id, [equipmentIds[0]]);

  // Модуль 2: Сила та витривалість (уроки 2-6)
  await assignEquipmentToModule(modules1[1].id, [
    equipmentIds[0], // Гантелі
    equipmentIds[1], // Плоский ролл
    equipmentIds[2], // Резинка для пілатесу
    equipmentIds[3], // М'яч для пілатесу
  ]);

  // Модуль 3: Баланс і гармонія (уроки 7-12)
  await assignEquipmentToModule(modules1[2].id, [
    equipmentIds[0], // Гантелі
    equipmentIds[1], // Плоский ролл
    equipmentIds[4], // Резинка кільцева
    equipmentIds[5], // Тенісний м'яч
    equipmentIds[6], // Блок для йоги
  ]);

  // Модуль 4: Рельєф і тонус (уроки 13-19)
  await assignEquipmentToModule(modules1[3].id, [
    equipmentIds[1], // Плоский ролл
    equipmentIds[2], // Резинка для пілатесу
    equipmentIds[3], // М'яч для пілатесу
  ]);

  // Модуль 5: Марафон енергії (уроки 21-27)
  await assignEquipmentToModule(modules1[4].id, [
    equipmentIds[0], // Гантелі
    equipmentIds[1], // Плоский ролл
    equipmentIds[2], // Резинка для пілатесу
    equipmentIds[3], // М'яч для пілатесу
  ]);

  console.log('Створення бенефітів...');
  const benefits = await createBenefits();

  // Призначаємо бенефіти курсу
  const benefitIds = benefits.map(benefit => benefit.id);
  await assignBenefitsToCourse(course1.id, benefitIds);

  console.log('Додавання відгуків...');
  await createReviews(adminUser.id, course1.id);

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

async function createModulesAndLessonsCourse1(courseId: number) {
  // Модуль 1: Швидкий старт
  const module1 = await prisma.module.create({
    data: {
      title: 'Ідеальний старт',
      description:
        'М’яке занурення в практику: готуємо тіло до навантажень, вивчаємо базові техніки дихання, активації м’язів і усвідомленого руху',
      imageUrl: '/cdn/images/1-module_1-course.jpg',
      orderIndex: 1,
      courseId,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Усе тіло',
      description: 'Баланс сили, витривалості та мобільності в одному занятті',
      videoUrl: 'https://vimeo.com/1102179222/4656f92779',
      imageUrl: '/cdn/images/1-lesson_1-course.JPG',
      duration: 724,
      orderIndex: 1,
      moduleId: module1.id,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      title: 'Сила та витривалість',
      description:
        'Прокачуємо м’язовий корсет, укріплюємо опору тіла, поступово збільшуючи інтенсивність та витривалість без перевантаження',
      imageUrl: '/cdn/images/2-module_1-course.jpg',
      orderIndex: 2,
      courseId,
    },
  });

  // Уроки для модуля 2
  await prisma.lesson.create({
    data: {
      title: 'Гнучкість тазобедренних суглобів',
      description:
        'Ця практика допоможе відновити мобільність, покращити кровообіг у зоні тазу та зняти м’язову напругу',
      videoUrl: 'https://vimeo.com/1102179959/0684150721',
      imageUrl: '/cdn/images/2-lesson_1-course.JPG',
      duration: 869,
      orderIndex: 2,
      moduleId: module2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Мобільність грудного відділу і дихання',
      description:
        'Ця практика допоможе зняти напругу з плечей, покращити поставу та глибше дихати',
      videoUrl: 'https://vimeo.com/1102180737/8c29deb385',
      imageUrl: '/cdn/images/3-lesson_1-course.JPG',
      duration: 834,
      orderIndex: 3,
      moduleId: module2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Прес і тазове дно',
      description:
        'Глибока, усвідомлена робота з центром тіла — не тільки для рельєфу, а для внутрішньої сили, стабільності й жіночого здоров’я',
      videoUrl: 'https://vimeo.com/1102181458/8865a0fd0c',
      imageUrl: '/cdn/images/4-lesson_1-course.JPG',
      duration: 677,
      orderIndex: 4,
      moduleId: module2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'МФР всього тіла',
      description:
        'Глибоке розслаблення, відновлення та звільнення тіла від хронічної напруги',
      videoUrl: 'https://vimeo.com/1102182094/cefa6ebef8',
      imageUrl: '/cdn/images/5-lesson_1-course.JPG',
      duration: 888,
      orderIndex: 5,
      moduleId: module2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Функціональне тіло',
      description:
        'Сильне, витривале, гнучке — тіло, яке працює злагоджено в кожному русі',
      videoUrl: 'https://vimeo.com/1102183031/f9391fef25',
      imageUrl: '/cdn/images/6-lesson_1-course.JPG',
      duration: 1111,
      orderIndex: 6,
      moduleId: module2.id,
    },
  });

  const module3 = await prisma.module.create({
    data: {
      title: 'Баланс і гармонія',
      description:
        'Вчимося керувати тілом у просторі, покращуємо координацію, гнучкість та ментальну рівновагу — всередині й зовні',
      orderIndex: 3,
      imageUrl: '/cdn/images/3-module_1-course.jpg',
      courseId,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Прес і гнучкість хребта',
      description:
        'Сильний центр і рухливий хребет — основа здорового, легкого тіла',
      videoUrl: 'https://vimeo.com/1102184147/e9489db4cf',
      imageUrl: '/cdn/images/7-lesson_1-course.JPG',
      duration: 1114,
      orderIndex: 7,
      moduleId: module3.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Сідниці, ноги',
      description:
        'Сила, витривалість і підтягнутість — усе, що потрібно для відчуття опори в тілі',
      videoUrl: 'https://vimeo.com/1102185163/bd0e336d49',
      imageUrl: '/cdn/images/8-lesson_1-course.JPG',
      duration: 1095,
      orderIndex: 8,
      moduleId: module3.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'МФР і мобільність стегон',
      description:
        'Знімаємо глибоку напругу, відновлюємо рухливість і покращуємо самопочуття',
      videoUrl: 'https://vimeo.com/1102186390/887649a461',
      imageUrl: '/cdn/images/9-lesson_1-course.JPG',
      duration: 975,
      orderIndex: 9,
      moduleId: module3.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Пілатес на все тіло',
      description: 'Гармонія сили, гнучкості та контролю в одному тренуванні',
      videoUrl: 'https://vimeo.com/1102187359/a7daddfc81',
      imageUrl: '/cdn/images/10-lesson_1-course.JPG',
      duration: 1742,
      orderIndex: 10,
      moduleId: module3.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Легкість у всьому тілі',
      description:
        'Відчуй свободу руху, розслаблення і гармонію в кожній клітині',
      videoUrl: 'https://vimeo.com/1102189109/577ef7cb25',
      imageUrl: '/cdn/images/11-lesson_1-course.JPG',
      duration: 900,
      orderIndex: 11,
      moduleId: module3.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Динамічний флоу',
      description: 'Плавність, енергія та рух — все зливається в один потік',
      videoUrl: 'https://vimeo.com/1102190093/10d3ed6aca',
      imageUrl: '/cdn/images/12-lesson_1-course.JPG',
      duration: 1202,
      orderIndex: 12,
      moduleId: module3.id,
    },
  });

  // Модуль 4: Підсумки і планування
  const module4 = await prisma.module.create({
    data: {
      title: 'Рельєф і тонус',
      description:
        'Фокус на силовому формуванні фігури: активізація глибоких м’язів, покращення лімфотоку, стабілізація й красивий м’язовий рельєф',
      orderIndex: 4,
      imageUrl: '/cdn/images/4-module_1-course.jpg',
      courseId,
    },
  });

  // Уроки для модуля 4
  await prisma.lesson.create({
    data: {
      title: 'Сила і гнучкість',
      description: 'Баланс напруги й розслаблення. Міць тіла — в його м’якості',
      videoUrl: 'https://vimeo.com/1102191320/21bac41601',
      imageUrl: '/cdn/images/13-lesson_1-course.JPG',
      duration: 1881,
      orderIndex: 13,
      moduleId: module4.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Вільна шия і плечі',
      description:
        'Знімаємо напругу, відновлюємо легкість і рухливість верхньої частини тіла',
      videoUrl: 'https://vimeo.com/1102193289/962a2d4f2a',
      imageUrl: '/cdn/images/15-lesson_1-course.JPG',
      duration: 806,
      orderIndex: 15,
      moduleId: module4.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Внутрішня частина і сідниці',
      description: 'Гармонійна форма, стабільність у тазі та красива хода',
      videoUrl: 'https://vimeo.com/1102194125/c1b887b1fd',
      imageUrl: '/cdn/images/16-lesson_1-course.JPG',
      duration: 1119,
      orderIndex: 16,
      moduleId: module4.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Грудний відділ і хребет',
      description: 'Відкритість, легке дихання і мобільність у кожному русі',
      videoUrl: 'https://vimeo.com/1102195287/8564fafdb8',
      imageUrl: '/cdn/images/17-lesson_1-course.JPG',
      duration: 988,
      orderIndex: 17,
      moduleId: module4.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Кісті,руки,шия',
      description:
        'Делікатне тренування для зняття напруги, покращення кровотоку та відчуття легкості',
      videoUrl: 'https://vimeo.com/1102196460/56c5c2828c',
      imageUrl: '/cdn/images/19-lesson_1-course.JPG',
      duration: 1095,
      orderIndex: 19,
      moduleId: module4.id,
    },
  });

  const module5 = await prisma.module.create({
    data: {
      title: 'Марафон енергії',
      description:
        'Динамічні функціональні тренування, які заряджають енергією, активують метаболізм і вивільняють справжню силу тіла',
      orderIndex: 5,
      imageUrl: '/cdn/images/5-module_1-course.jpg',
      courseId,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Гнучкість тазобедренних',
      description: 'Розкриття, м’якість і свобода в русі таза та ніг',
      videoUrl: 'https://vimeo.com/1102208787/35f78133d7',
      imageUrl: '/cdn/images/21-lesson_1-course.JPG',
      duration: 1258,
      orderIndex: 21,
      moduleId: module5.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Сила спини',
      description: 'Опора, стабільність і красива постава',
      videoUrl: 'https://vimeo.com/1102210145/58625b85a0',
      imageUrl: '/cdn/images/22-lesson_1-course.JPG',
      duration: 1235,
      orderIndex: 22,
      moduleId: module5.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Внутрішній кор',
      description:
        'Глибока сила зсередини. Контроль, стабільність і відчуття центру',
      videoUrl: 'https://vimeo.com/1102211415/5186b5b486',
      imageUrl: '/cdn/images/23-lesson_1-course.JPG',
      duration: 982,
      orderIndex: 23,
      moduleId: module5.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Челендж все тіло',
      description: 'Тренування для зміцнення, гнучкості та енергії всього тіла',
      videoUrl: 'https://vimeo.com/1102212535/fb43b88c5a',
      imageUrl: '/cdn/images/24-lesson_1-course.JPG',
      duration: 1264,
      orderIndex: 24,
      moduleId: module5.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Челендж все тіло',
      description: 'Це не просто тренування — це шлях до нової версії себе!',
      videoUrl: 'https://vimeo.com/1102214184/dc1064b0c5',
      imageUrl: '/cdn/images/26-lesson_1-course.JPG',
      duration: 1023,
      orderIndex: 26,
      moduleId: module5.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Функціональне флоу',
      description:
        'Цілісність, плавність і максимальна інтеграція тіла та свідомості. Цей потік допоможе відчути цілісність і гармонію у всьому тілі, покращити координацію та енергію',
      videoUrl: 'https://vimeo.com/1102215389/af9fec46d9',
      imageUrl: '/cdn/images/27-lesson_1-course.JPG',
      duration: 1212,
      orderIndex: 27,
      moduleId: module5.id,
    },
  });

  return [module1, module2, module3, module4, module5];
}

async function createBaseEquipment() {
  console.log('Створення базового набору обладнання...');

  const equipmentItems = [
    // 0
    {
      name: 'Гантелі',
      description: 'Гантелі',
      imageUrl: '/cdn/images/equip-gantel.webp',
    },

    // 1
    {
      name: 'Плоский Ролл',
      description: 'Плоский Ролл',
      imageUrl: '/cdn/images/equip-roll.jpg',
    },

    // 2
    {
      name: 'Резинка дя пілатесу',
      description: 'Резинка дя пілатесу',
      imageUrl: '/cdn/images/equip-elastic-long.webp',
    },

    // 3
    {
      name: 'М’яч для пілтесу',
      description: 'М’яч для пілтесу',
      imageUrl: '/cdn/images/equip-ball.webp',
    },

    // 4
    {
      name: 'Резинка кільцева',
      description: 'Резинка кільцева',
      imageUrl: '/cdn/images/equip-elastic-long.webp',
    },

    // 5
    {
      name: "Тенісний м'яч",
      description: "Тенісний м'яч",
      imageUrl: '/cdn/images/equip-tennis.webp',
    },

    // 6
    {
      name: 'Блок для йоги',
      description: 'Блок для йоги',
      imageUrl: '/cdn/images/equip-yoga-block.webp',
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

async function createReviews() {
  await prisma.generalReview.create({
    data: {
      rating: 5,
      comment:
        'Тут усе — з такою любов’ю! Тренування м’які, але ефективні, після них я не валяюсь без сил, а навпаки — відчуваю легкість і радість. Нарешті зникло відчуття, що я “щось винна” своєму тілу.',
    },
  });
  // await prisma.generalReview.create({
  //   data: {
  //     rating: 5,
  //     comment:
  //       'Ідеальне поєднання сили та гнучкості. Функціональні вправи - влучно в ціль, а пілатес додає усвідомленості та витонченості руху. Дуже потужний курс!',
  //   },
  // });
  await prisma.generalReview.create({
    data: {
      rating: 5,
      comment:
        'Можу з власного досвіду вже сказати і порівняти, коли займалася саме з Владою, то все було набагато краще і при тому у всіх сферах, інколи авжеж були форс мажорні обставини, але Влада ти, як чарівна паличка - все швидко виправляла!',
    },
  });
  await prisma.generalReview.create({
    data: {
      rating: 5,
      comment:
        'Не знаю, мені всеодно важко робити тренування, які б легкі вони не були. Але ця креативність і відчуття після змушують мене продовжувати.',
    },
  });
  await prisma.generalReview.create({
    data: {
      rating: 5,
      comment:
        'Владині тренування це навіть не тренування, а якесь перевтілення, що ти робиш з людьми?)',
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
