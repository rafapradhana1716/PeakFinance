import express from 'express';
import usersRouter from './routes/authUser.js';
import pageRouter from './routes/pageRouter.js';
import transactionRouter from './routes/transactionsRouter.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import { getBalance } from './routes/financeService.js';
import { getChartData } from './routes/financeService.js';

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
app.use(async (req, res, next) => {
    const token = req.cookies.token;
    if(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            res.locals.user = decoded;
            res.locals.balance = await getBalance(decoded.id);

            const { labels, data } = await getChartData(req.user.id);
            res.locals.data = data;
            res.locals.labels = labels;
        } catch (err) {
            req.user = null;
            res.locals.user = null;
            res.locals.balance = 0;
            res.locals.chartData = null;
            res.locals.chartLabels = null;
        }
    } else {
        req.user = null;
        res.locals.user = null;
        res.locals.balance = 0;
        res.locals.chartData = null;
        res.locals.chartLabels = null;
    }
    next();
});
app.use("/auth", usersRouter);
app.use("/transaction",transactionRouter);
app.use("/", pageRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});