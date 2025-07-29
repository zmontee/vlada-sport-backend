import { Router } from 'express';
import mailController from '@/controllers/mailController';

const mailRouter = Router();

mailRouter.post('/send', mailController.sendEmail);

export default mailRouter;
