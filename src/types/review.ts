export interface GeneralReview {
  id: number;
  rating: number;
  comment: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  createdAt: Date;

  authorName?: string | null;
  authorSurname?: string | null;
  authorExperience?: string | null;
  authorSex?: string | null;

  userId?: number | null;
  user?: {
    id: number;
    name: string;
    surname: string;
    imageUrl?: string | null;
    experience?: string | null;
    sex: string;
  } | null;
}

export interface CourseReview extends GeneralReview {
  courseId: number;
  course?: {
    id: number;
    title: string;
    imageUrl?: string | null;
  };
}

export interface CreateGeneralReviewDTO {
  rating: number;
  comment: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  userId?: number;
  authorName?: string | null;
  authorSurname?: string | null;
  authorExperience?: string | null;
  authorSex?: string | null;
}

export interface CreateCourseReviewDTO extends CreateGeneralReviewDTO {
  courseId: number;
}

export interface UpdateGeneralReviewDTO {
  rating?: number;
  comment?: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  userId?: number | null;
  authorName?: string | null;
  authorSurname?: string | null;
  authorExperience?: string | null;
  authorSex?: string | null;
}

export interface UpdateCourseReviewDTO extends UpdateGeneralReviewDTO {
  courseId?: number;
}
