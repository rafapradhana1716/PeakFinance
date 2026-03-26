import express from "express";
import bcrypt from "bcrypt";
import db from "../config/database.js";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body

    if(!email || !password) {
        return res.status(400).json({ message: "Email dan Password wajib diisi!" });
    }

    try {
        const rows = await db.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if(rows.length === 0) {
            return res.status(400).json({ message: "Email atau Password salah!" })
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.pass);
        if(!match) {
            return res.status(401).json({ message: "Email atau Password salah!" });   
        }

        const payload = {
            id: user.id,
            username: user.user
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 3600000,
        });

        return res.json({
            message: "Login berhasil!",
            user: {
                id: user.id,
                name: user.user
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Terjadi kesalahan pada database!" });
    }
});

router.post("/register", async (req, res) => {
    const { email, name, password } = req.body
    const hashPass = await bcrypt.hash(password, 10);

    if(!email || !name || !password) {
        return res.status(400).json({ message: "Semua field wajib diisi!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        return res.status(400).json({ message: "Format email tidak valid!" });
    }

    try {
        const existedUser = await db.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if (existedUser.length > 0) {
            return res.status(400).json({ message: "Email terdaftar!" })
        }

        const result = await db.query(
            'INSERT INTO users (email, user, pass) VALUES (?, ?, ?)', [email, name, hashPass]
        );
        const newUserId = Number(result.insertId);

        const payload = { id:  newUserId, username: name};

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 3600000
        });

        return res.status(200).json({
            message: "User berhasil ditambahkan dan otomatis login!",
            name: name
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal registrasi user!" });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout berhasil!" })
});

export default router;