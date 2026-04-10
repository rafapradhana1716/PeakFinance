import express from 'express';
import usersRouter from './routes/authUser.js';
import pageRouter from './routes/pageRouter.js';
import transactionRouter from './routes/transactionsRouter.js';
import financeRouter from './routes/financeRouter.js';
import savingsRouter from './routes/savingsRouter.js';
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

app.use((req, res, next) => {
    res.locals.env = {
        BASEURL_VITE: process.env.BASEURL_VITE,
        PROJECT_NAME: "PeakFinance"
    };
    next();
});

app.use(express.static(path.resolve('public')));
app.use("/auth", usersRouter);
app.use("/trx",transactionRouter);
app.use("/finance", financeRouter);
app.use("/savings", savingsRouter);
app.use("/", pageRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});