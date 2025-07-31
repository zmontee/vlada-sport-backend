export interface GeneralReview {
  id: number;
  rating: number;
  comment: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  createdAt: Date;
  userId?: number | null;
  user?: {
    id: number;
    name: string;
    surname: string;
    imageUrl?: string | null;
  } | null;
}

export interface CreateGeneralReviewDTO {
  rating: number;
  comment: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  userId?: number;
}

export interface UpdateGeneralReviewDTO {
  rating?: number;
  comment?: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  userId?: number | null;
}
