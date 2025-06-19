import type {
  CourseProgress,
  LessonProgress,
  ModuleProgress,
} from '@prisma/client';

export interface CompleteLessonResult {
  lessonProgress: LessonProgress;
  moduleCompleted: boolean;
  courseCompleted: boolean;
  moduleProgress?: ModuleProgress;
  courseProgress?: CourseProgress;
  nextLessonUnlocked?: number;
  nextModuleUnlocked?: number;
}

export interface CompleteModuleResult {
  moduleCompleted: boolean;
  moduleProgress: ModuleProgress;
  lessonsCompleted: number;
  courseCompleted?: boolean;
  courseProgress?: CourseProgress;
  nextModuleUnlocked?: number;
}
