import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import createHttpError from 'http-errors';

const cdnDir = path.join(process.cwd(), 'cdn');
const reviewsDir = path.join(cdnDir, 'reviews');
const usersDir = path.join(cdnDir, 'users');

if (!fs.existsSync(cdnDir)) {
  fs.mkdirSync(cdnDir);
}

if (!fs.existsSync(reviewsDir)) {
  fs.mkdirSync(reviewsDir);
}

if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir);
}

const reviewImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, reviewsDir);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    cb(null, uniqueFilename);
  },
});

const userImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, usersDir);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    cb(null, uniqueFilename);
  },
});

const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createHttpError(400, 'Дозволені лише зображення (jpg, png, gif, webp)'));
  }
};

export const reviewUpload = multer({
  storage: reviewImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const userImageUpload = multer({
  storage: userImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const deleteFile = (filePath: string) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const getFileUrl = (
  filename: string | null | undefined
): string | null => {
  if (!filename) return null;
  return `/cdn/reviews/${filename}`;
};

export const getFilenameFromUrl = (
  url: string | null | undefined
): string | null => {
  if (!url) return null;
  const parts = url.split('/');
  return parts[parts.length - 1];
};

export const getUserImageUrl = (
  filename: string | null | undefined
): string | null => {
  if (!filename) return null;
  return `/cdn/users/${filename}`;
};
