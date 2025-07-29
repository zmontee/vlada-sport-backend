import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from '@/middlewares/errorHandler';
import authRouter from '@/routes/auth';
import userRouter from '@/routes/users';
import cdnRouter from '@/routes/cdn';
import courseRouter from '@/routes/courses';
import purchaseRouter from '@/routes/purchase';
import progress from '@/routes/progress';
import progressRouter from '@/routes/progress';
import mailRouter from '@/routes/mail';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/cdn', cdnRouter);
app.use('/courses', courseRouter);
app.use('/purchase', purchaseRouter);
app.use('/progress', progressRouter);
app.use('/mail', mailRouter);

app.use(errorHandler);

app.listen(process.env.PORT || 2998, () => {
  console.log(
    `Server is running: http://localhost:${process.env.PORT || 2998}`
  );
});

export default app;
