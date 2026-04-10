import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

router.get("/goals", verifyToken, async (req, res) => {
    try {
        const rows = await db.query(
            'SELECT id, title, target_amount, current_amount FROM savings_goals WHERE user_id = ? AND status = "active"',
            [req.user.id]
        );
        res.json({ success: true, goals: rows });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.get("/transactions", verifyToken, async (req, res) => {
    try {
        const rows = await db.query(
            `SELECT
            DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
            DAY(created_at) AS day,
            SUM(amount) AS total_amount
            FROM transactions
            WHERE user_id = ? AND type = 'saving'
            AND MONTH(created_at) = MONTH(CURRENT_DATE())
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
            GROUP BY day`,
            [req.user.id]
        );
        res.json({ success: true, history: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

router.post("/goals/:id/invest", verifyToken, async (req, res) => {
    const { amount, name} = req.body;
    const goalId = req.params.id;

    if(!amount || !name) {
        return res.status(400).json({ success: false, message: "Semua field wajib diisi!" });
    }

    if(amount <= 0) {
        return res.status(400).json({ success: false, message: "Jumlah tabungan harus lebih dari 0!" });
    }

    try {
        await db.query(
            `INSERT INTO transactions (user_id, name, type, amount, savings_goal_id) VALUES
            (?, ?, 'saving', ?, ?)`,
            [req.user.id, `Kamu telah menabung untuk ${name}`, amount, goalId]
        );

        const result = await db.query(
            'UPDATE savings_goals SET current_amount = current_amount + ?, status = CASE WHEN current_amount + ? >= target_amount THEN "achieved" ELSE status END WHERE id = ? AND user_id = ?',
            [amount, amount, goalId, req.user.id]
        );

        if(result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Target tabungan tidak ditemukan!" });
        }

        res.json({ success: true, message: "Tabungan berhasil ditambahkan!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal update tabungan!" });
    }
});

router.post("/goals", verifyToken, async (req, res) => {
    const { title, target, current } = req.body;
    const userId = req.user.id;

    if(!title || !target) {
        return res.status(500).json({ message: "Semua field wajib diisi!" });
    }

    if(target <= 0) {
        return res.status(500).json({ message: "Target Tabungan wajib lebih dari 0!" });
    }

    try {
        await db.query(
            'INSERT INTO savings_goals (user_id, title, target_amount, current_amount, status) VALUES (?, ?, ?, ?, ?)',
            [userId, title, target, current ? current : 0, current >= target ? "achieved":"active"]
        );

        return res.redirect("/");
    } catch (err) {
        return res.status(500).json({ message: "Gagal menambahkan savings goal!", error: err });
    }
});

export default router;