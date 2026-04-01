import express from 'express';
import usersRouter from './routes/authUser.js';
import indexRouter from './routes/pageRouter.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';


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
app.use((req, res, next) => {
    const token = req.cookies.token;
    if(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.locals.user = decoded;
        } catch (err) {
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
});
app.use("/auth", usersRouter);
app.use("/", indexRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});