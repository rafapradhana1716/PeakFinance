import express from "express";
import bcrypt from "bcrypt";
import db from "../database.js";
const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body
    let conn;

    if(!email || !password) {
        return res.status(400).json({ message: "Email dan Password wajib diisi!" });
    }

    try {
        conn = await db.getConnection();
        const rows = await conn.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if(rows.length === 0) {
            return res.status(400).json({ message: "Email atau Password salah!" })
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.pass);

        if(match) {
            return res.json({
                message: "Login berhasil!",
                user: {
                    id: user.id,
                    name: user.name
                }
            });
        } else {
            return res.status(401).json({ message: "Email atau Password salah!" });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Terjadi kesalahan pada database!" });
    } finally {
        if(conn) conn.release();
    }
});

router.post("/register", async (req, res) => {
    const { email, name, password } = req.body
    const hashPass = await bcrypt.hash(password, 10);
    let conn;

    if(!email || !name || !password) {
        return res.status(400).json({ message: "Semua field wajib diisi!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        return res.status(400).json({ message: "Format email tidak valid!" });
    }

    try {
        conn = await db.getConnection();
        const existedUser = await conn.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if (existedUser.length > 0) {
            return res.status(400).json({ message: "User terdaftar!" })
        }

        await conn.query(
            'INSERT INTO users (email, user, pass) VALUES (?, ?, ?)', [email, name, hashPass]
        );

        return res.status(200).json({
            message: "User berhasil ditambahkan",
            user: { name }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal registrasi user!" });
    }
});

router.post("/logout", (req, res) => {
    res.send("Logout endpoint");
});

export default router;