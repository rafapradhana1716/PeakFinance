import express from "express";
import db from "../config/database.js";
import { verifyToken } from "../middleware/auth.js";
const router = express.Router();

export const getBalance = async (userId) => {
    const rows = await db.query(
        `SELECT totals.total_income, totals.total_expense, COALESCE(sg.current_amount, 0) AS target_amount
         FROM (
             SELECT
                 COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
                 COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
             FROM transactions
             WHERE user_id = ?
         ) totals
         LEFT JOIN users u ON u.id = ?
         LEFT JOIN savings_goals sg ON sg.id = u.selected_goal AND sg.user_id = u.id`,
        [userId, userId]
    );

    const totalIncome = Number(rows[0].total_income);
    const totalExpense = Number(rows[0].total_expense);
    return {
        totalBalance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
        targetAmount: Number(rows[0].target_amount)
    };
};

export const getChartData = async (userId, days = 30, type = "balance") => {
    let currentBalance = 0;
    let netCalculation = "SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)";

    if(type === "income") {
        netCalculation = "SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)";
    } else if(type === "expense") {
        netCalculation = "SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)";
    }

    if (type === 'balance') {
        const openingRows = await db.query(
            `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) AS opening_balance
             FROM transactions
             WHERE user_id = ? AND created_at < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            [userId, days]
        );
        currentBalance = Number(openingRows[0].opening_balance);
    }

    const rows = await db.query(
        `SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal,
            COALESCE(${netCalculation}, 0) AS daily_net
        FROM transactions 
        WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY tanggal
        ORDER BY tanggal ASC`,
        [userId, days]
    );

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

export const getCategoryData = async (userId) => {
    const rows = await db.query(
        `SELECT category, SUM(amount) AS total_amount
        FROM transactions
        WHERE user_id = ? AND type = 'expense'
        GROUP BY category
        ORDER BY total_amount DESC`,
        [userId]
    );

    const totalRow = await db.query(
        `SELECT SUM(amount) as total_all
        FROM transactions
        WHERE user_id = ? AND type = 'expense'`,
        [userId]
    );
    const totalAll = Number(totalRow[0].total_all) || 0;

    return {
        categories: rows.map(r => ({
            name: r.category || "Lainnya",
            amount: Number(r.total_amount),
            percentage: totalAll > 0 ? Math.round((Number(r.total_amount) / totalAll) * 100) : 0
        })),
        totalAll
    };
};

router.get("/balance", verifyToken, async (req, res) => {
    try {
        const balanceData = await getBalance(req.user.id);
        res.json({balance: balanceData.totalBalance, income: balanceData.totalIncome, expense: balanceData.totalExpense, target: balanceData.targetAmount});
    } catch {
        res.status(500).json({ error: "Gagal mengambil data keuangan" })
    }
});

router.get("/statistics", verifyToken, async (req, res) => {
    try {
        const days = Number(req.query.days ?? 30);
        const type = req.query.type ?? "balance";
        if (!Number.isInteger(days) || days < 1 || days > 365 || !['balance', 'income', 'expense'].includes(type)) {
            return res.status(400).json({ error: "Parameter statistik tidak valid." });
        }
        const chartData = await getChartData(req.user.id, days, type);
        res.json(chartData);
    } catch {
        res.status(500).json({ error: "Gagal mengambil data grafik" });
    }
});

router.get("/category", verifyToken, async (req, res) => {
    try {
        const data = await getCategoryData(req.user.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Gagal mengambil data kategori" });
    }
});

export default router;
