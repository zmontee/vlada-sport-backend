import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

console.log(process.env.PORT);

app.use('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(process.env.PORT || 2998);

export default app;
