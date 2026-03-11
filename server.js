import express from "express";
import dashboardRouter from "./routes/index.js";
const app = express();
const port = 3000;

app.use("/dashboard", dashboardRouter);

app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});