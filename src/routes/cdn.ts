// src/routes/cdn.ts
import express from 'express';
import { authenticateJWT } from '@/middlewares/auth';
import { serveFile, upload, uploadFile } from '@/controllers/cdnController';

const cdnRouter = express.Router();

// Upload endpoint (admin only)
cdnRouter.post('/upload', authenticateJWT, upload.single('file'), uploadFile);

// Get image endpoint (public)
cdnRouter.get('/:type/:fileName', serveFile);

// Get video endpoint (restricted to users who purchased the course)
cdnRouter.get('/:type/:courseId/:fileName', authenticateJWT, serveFile);

export default cdnRouter;
