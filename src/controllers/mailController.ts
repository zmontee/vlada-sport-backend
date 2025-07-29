import nodemailer from 'nodemailer';
import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'zmontee@gmail.com',
    pass: 'rahq shmh opit kpvl',
  },
});

const mailController = {
  sendEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, subject, text, html } = req.body;

      if (!to || !subject || (!text && !html)) {
        throw createHttpError(
          400,
          "Відсутні обов'язкові поля (to, subject, text або html)"
        );
      }

      const mailOptions = {
        from: 'zmontee@gmail.com',
        to,
        subject,
        text,
        html,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        message: 'Електронний лист успішно відправлено',
      });
    } catch (error) {
      next(error);
    }
  },
};

export default mailController;
