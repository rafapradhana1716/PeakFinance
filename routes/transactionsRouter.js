import express from 'express';
const router = express.Router();

router.post("/addTransaction", (req, res) => {
    const { type, category, amount, description } = req.body;
})