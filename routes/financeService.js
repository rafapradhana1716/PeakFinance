import db from "../config/database.js";

export const getBalance = async (userId) => {
    try {
        const rows = await db.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_balance
            FROM transactions 
            WHERE user_id = ?`,
            [userId]
        );

        return rows[0].total_balance;
    } catch (err) {
        console.error("Error hitung saldo:", err);
        return 0;
    }
};