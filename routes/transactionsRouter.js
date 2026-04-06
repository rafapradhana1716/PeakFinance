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

router.get("/transactions-data", async (req, res) => {
    const days = req.query.days || 30;
    try {
        const rows = await db.query(
            `SELECT * FROM transactions WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at DESC`,
            [req.user.id, parseInt(days)]
        );
        res.json({ success: true, transactions: rows });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil data" });
    }
});

export default router;