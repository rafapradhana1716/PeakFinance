import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
import { cleanText, optionalText, positiveAmount } from '../middleware/validation.js';
const router = express.Router();

const transactionTypes = new Set(['income', 'expense']);

router.post("/transactions", verifyToken, async (req, res) => {
    const name = cleanText(req.body?.name, 50);
    const type = cleanText(req.body?.type, 20);
    const category = optionalText(req.body?.category, 50);
    const description = optionalText(req.body?.description, 2000);
    const amount = positiveAmount(req.body?.amount);
    const userId = req.user.id;

    if(!name || !transactionTypes.has(type) || category === null || description === null || amount === null) {
        return res.status(400).json({ message: "Data transaksi tidak valid." });
    }

    try {
        await db.query(
            "INSERT INTO transactions (user_id, name, type, category, amount, description) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, name, type, category || null, amount, description]
        );

        return res.status(201).json({ success: true, message: "Transaksi berhasil ditambahkan!" });
    } catch (err) {
        return res.status(500).json({ message: "Gagal menambahkan transaksi!" });
    }
});

router.get("/transactions", verifyToken, async (req, res) => {
    const requestedDays = Number(req.query.days ?? 30);
    const days = Number.isInteger(requestedDays) && requestedDays >= 1 && requestedDays <= 365
        ? requestedDays
        : null;
    if (days === null) {
        return res.status(400).json({ success: false, message: "Rentang hari harus antara 1-365." });
    }
    try {
        const rows = await db.query(
            `SELECT * FROM transactions WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at DESC`,
            [req.user.id, days]
        );
        res.json({ success: true, transactions: rows });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil data" });
    }
});

export default router;
