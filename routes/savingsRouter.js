import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
import { cleanText, positiveAmount, positiveId } from '../middleware/validation.js';
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
        console.error(err);
        res.status(500).json({ success: false, message: "Gagal mengambil riwayat tabungan." });
    }
});

router.post("/goals/:id/invest", verifyToken, async (req, res) => {
    const amount = positiveAmount(req.body.amount);
    const goalId = positiveId(req.params.id);

    if(amount === null || goalId === null) {
        return res.status(400).json({ success: false, message: "Data tabungan tidak valid." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const goals = await connection.query(
            'SELECT id, title FROM savings_goals WHERE id = ? AND user_id = ? AND status = "active" FOR UPDATE',
            [goalId, req.user.id]
        );
        if (goals.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Target tabungan aktif tidak ditemukan!" });
        }

        await connection.query(
            `INSERT INTO transactions (user_id, name, type, amount, savings_goal_id) VALUES
            (?, ?, 'saving', ?, ?)`,
            [req.user.id, `Menabung untuk ${goals[0].title}`.slice(0, 50), amount, goalId]
        );

        await connection.query(
            'UPDATE savings_goals SET current_amount = current_amount + ?, status = CASE WHEN current_amount + ? >= target_amount THEN "achieved" ELSE status END WHERE id = ? AND user_id = ?',
            [amount, amount, goalId, req.user.id]
        );

        await connection.commit();

        res.json({ success: true, message: "Tabungan berhasil ditambahkan!" });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: "Gagal update tabungan!" });
    } finally {
        if (connection) connection.release();
    }
});

router.post("/goals", verifyToken, async (req, res) => {
    const title = cleanText(req.body.title, 100);
    const target = positiveAmount(req.body.target);
    const current = positiveAmount(req.body.current ?? 0, { allowZero: true });
    const userId = req.user.id;

    if(!title || target === null || current === null) {
        return res.status(400).json({ message: "Data target tabungan tidak valid." });
    }

    try {
        await db.query(
            'INSERT INTO savings_goals (user_id, title, target_amount, current_amount, status) VALUES (?, ?, ?, ?, ?)',
            [userId, title, target, current, current >= target ? "achieved":"active"]
        );

        return res.json({ message: "Target tabungan berhasil dibuat!" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Gagal menambahkan savings goal!" });
    }
});

router.patch("/goals/:id", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const goalId = positiveId(req.params.id);

    if (goalId === null) {
        return res.status(400).json({ success: false, message: "ID target tidak valid!" });
    }

    try {
        const goals = await db.query(
            'SELECT id FROM savings_goals WHERE id = ? AND user_id = ? LIMIT 1',
            [goalId, userId]
        );

        if (goals.length === 0) {
            return res.status(404).json({ success: false, message: "Target tabungan tidak ditemukan!" });
        }

        await db.query('UPDATE users SET selected_goal = ? WHERE id = ?', [goalId, userId]);

        return res.json({ success: true, message: "Target tabungan berhasil diperbarui!" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Gagal memperbarui target tabungan!" });
    }
});

export default router;
