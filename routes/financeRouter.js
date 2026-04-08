import express from "express";
import db from "../config/database.js";
const router = express.Router();

export const getBalance = async (userId) => {
    try {
        const balance = await db.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_balance
            FROM transactions 
            WHERE user_id = ?`,
            [userId]
        );

        const income = await db.query(
            `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income
            FROM transactions
            WHERE user_id = ?`,
            [userId]
        );

        const expense = await db.query(
            `SELECT COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
            FROM transactions
            WHERE user_id = ?`,
            [userId]
        );

        const totalBalance = Number(balance[0].total_balance);
        const totalIncome = Number(income[0].total_income);
        const totalExpense = Number(expense[0].total_expense);
        return { totalBalance, totalIncome, totalExpense };
    } catch (err) {
        console.error("Error hitung saldo:", err);
        return 0;
    }
};

export const getChartData = async (userId, days = 30, type = "balance") => {
    let currentBalance = 0;
    let netCalculation = "SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)";

    if(type === "income") {
        netCalculation = "SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)";
    } else if(type === "expense") {
        netCalculation = "SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)";
    }

    const rows = await db.query(
        `SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal,
            ${netCalculation} AS daily_net
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

router.get("/balance-data", async (req, res) => {
    try {
        const balanceData = await getBalance(req.user.id);
        res.json({balance: balanceData.totalBalance, income: balanceData.totalIncome, expense: balanceData.totalExpense});
    } catch {
        res.status(500).json({ error: "Gagal mengambil data keuangan" })
    }
});

router.get("/chart-data", async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const type = req.query.type || "balance";
        const chartData = await getChartData(req.user.id, days, type);
        res.json(chartData);
    } catch {
        res.status(500).json({ error: "Gagal mengambil data grafik" });
    }
});

router.get("/category-data", async (req, res) => {
    try {
        const data = await getCategoryData(req.user.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Gagal mengambil data kategori" });
    }
});

export default router;