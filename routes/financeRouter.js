import express from "express";
import db from "../config/database.js";
const router = express.Router();

export const getBalance = async (req, res, next) => {
    try {
        const rows = await db.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_balance
            FROM transactions 
            WHERE user_id = ?`,
            [req.user.id]
        );

        res.locals.balance = rows[0].total_balance;
        next();
    } catch (err) {
        console.error("Error hitung saldo:", err);
        res.locals.balance = 0;
        next();
    }
};

export const getChartData = async (userId) => {
    const rows = await db.query(
        `SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal,
            SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS daily_net
        FROM transactions 
        WHERE user_id = ?
        GROUP BY tanggal
        ORDER BY tanggal ASC`,
        [userId]
    )

    let currentBalance = 0;
    const labels = [];
    const data = [];

    rows.forEach((row, index) => {
        const dateNow = new Date(row.tanggal);

        if(index > 0) {
            const datePrev = new Date(rows[index - 1].tanggal);
            const gap = (dateNow - datePrev) / (1000 * 60 * 60 * 24);

            for (let i = 1; i < gap; i++) {
                const dateGap = new Date(datePrev);
                dateGap.setDate(datePrev.getDate() + i);

                labels.push(dateGap.toISOString().split('T')[0]);
                data.push(currentBalance);
            }
        }

        currentBalance += Number(row.daily_net);
        labels.push(row.tanggal);
        data.push(currentBalance);
    });

    return { labels, data };
};

router.get("/chart-data", async (req, res) => {
    try {
        const chartData = await getChartData(req.user.id);
        res.json(chartData);
    } catch {
        res.status(500).json({ error: "Gagal mengambil data grafik" });
    }
});

export default router;