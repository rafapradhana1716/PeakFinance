import express from 'express';
import db from '../config/database.js';
const router = express.Router();

router.post("/add", async (req, res) => {
    const { name, type, category, amount, description } = req.body;
    const userId = req.user.id;

    try {
        await db.query(
            "INSERT INTO transactions (user_id, name, type, category, amount, description) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, name, type, category, amount, description]
        );

        return res.redirect("/");
    } catch (err) {
        return res.status(500).send(err);
    }
});

export default router;