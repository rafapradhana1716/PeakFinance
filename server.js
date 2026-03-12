import express from "express";
import usersRouter from "./routes/users.js";
import indexRouter from './routes/index.js';
import 'dotenv/config';

const app = express();
const port = process.env.PORT;

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use("/login", usersRouter);
app.use("/", indexRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});