import express from 'express';
import usersRouter from './routes/authUser.js';
import indexRouter from './routes/index.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';


const app = express();
const port = process.env.PORT;

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:8080",
    credentials: true
}));

app.use(express.static(path.resolve('public')));
app.use("/auth", usersRouter);
app.use("/", indexRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});