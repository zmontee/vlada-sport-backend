// src/controllers/cdnController.ts
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, existsSync } from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get the directory name using ES modules approach
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define CDN paths
const CDN_ROOT = path.join(__dirname, '../../cdn');
const IMAGES_DIR = path.join(CDN_ROOT, 'images');
const VIDEOS_DIR = path.join(CDN_ROOT, 'videos');

// Ensure directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir(CDN_ROOT, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.mkdir(VIDEOS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating CDN directories:', error);
  }
};

// Initialize directories
ensureDirectories();

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const isVideo = file.mimetype.startsWith('video/');

      if (isVideo) {
        // Get courseId from request parameters or body
        const courseId = req.body.courseId;
        if (!courseId) {
          return cb(new Error('Course ID is required for video uploads'), '');
        }

        // Create course-specific directory if it doesn't exist
        const courseDir = path.join(VIDEOS_DIR, courseId.toString());
        await fs.mkdir(courseDir, { recursive: true });
        cb(null, courseDir);
      } else {
        // Images go to the general images directory
        cb(null, IMAGES_DIR);
      }
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  },
});

// File filter for multer
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only images and videos are allowed.'));
  }
};

// Setup multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 100, // 100MB limit
  },
});

// Upload file controller
export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw createHttpError(400, 'No file uploaded');
    }

    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    let fileUrl = '';

    if (fileType === 'video') {
      const courseId = req.body.courseId;
      if (!courseId) {
        throw createHttpError(400, 'Course ID is required for video uploads');
      }

      fileUrl = `/cdn/videos/${courseId}/${req.file.filename}`;
    } else {
      fileUrl = `/cdn/images/${req.file.filename}`;
    }

    return res.status(201).json({
      success: true,
      fileType,
      fileName: req.file.filename,
      fileUrl,
      originalName: req.file.originalname,
    });
  } catch (error) {
    next(error);
  }
};

// Serve file controller
export const serveFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, fileName, courseId } = req.params;

    // For images, allow public access
    if (type === 'images') {
      const filePath = path.join(IMAGES_DIR, fileName);

      if (!existsSync(filePath)) {
        throw createHttpError(404, 'File not found');
      }

      const ext = path.extname(fileName).toLowerCase();
      const contentType =
        {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
        }[ext] || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      const stream = createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    // For videos, check if user has purchased the course
    if (type === 'videos' && courseId) {
      // Get user from request (should be set by auth middleware)
      const userId = req.user?.userId;
      if (!userId) {
        throw createHttpError(401, 'Authentication required');
      }

      // Check if user has purchased the course
      const purchase = await prisma.purchase.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: parseInt(courseId),
          },
        },
      });

      if (!purchase) {
        throw createHttpError(
          403,
          'You must purchase this course to access its videos'
        );
      }

      // User has purchased the course, serve the video
      const filePath = path.join(VIDEOS_DIR, courseId, fileName);

      if (!existsSync(filePath)) {
        throw createHttpError(404, 'Video not found');
      }

      res.setHeader('Content-Type', 'video/mp4');
      const stream = createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    throw createHttpError(400, 'Invalid request');
  } catch (error) {
    next(error);
  }
};
