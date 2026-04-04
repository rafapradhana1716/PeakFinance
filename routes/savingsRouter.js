import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

router.post("/add", verifyToken, async (req, res) => {
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
            [userId, title, target, current ? current : 0, current == target ? "achieved":"active"]
        );

        return res.redirect("/");
    } catch (err) {
        return res.status(500).json({ message: "Gagal menambahkan savings goal!", error: err });
    }
});

export default router;