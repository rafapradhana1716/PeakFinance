import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

router.post("/add", verifyToken, async (req, res) => {
    const { name, type, category, amount, description } = req.body;
    const userId = req.user.id;

    if(!name || !type || !category || !amount || !description) {
        return res.status(400).json({ message: "Semua field wajib diisi!" });
    }

    if(amount <= 0) {
        return res.status(400).json({ message: "Jumlah uang dilarang 0 atau negatif!" });
    }

    try {
        await db.query(
            "INSERT INTO transactions (user_id, name, type, category, amount, description) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, name, type, category, amount, description ? description : ""]
        );

        return res.redirect("/");
    } catch (err) {
        return res.status(500).send(err);
    }
});

export default router;