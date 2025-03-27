import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '@/middlewares/errorHandler';
import authRouter from '@/routes/auth';
import userRouter from '@/routes/users';
import cookieParser from 'cookie-parser';

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

app.use(errorHandler);

app.listen(process.env.PORT || 2998, () => {
  console.log(
    `Server is running: http://localhost:${process.env.PORT || 2998}`
  );
});

export default app;
