import express from "express";
import bcrypt from "bcrypt";
import db from "../config/database.js";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        message: "Terlalu banyak percobaan, coba lagi nanti!"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/login", authLimiter, async (req, res) => {
    const { username, password, rememberMe } = req.body

    if(!username || !password) {
        return res.status(400).json({ message: "Email dan Password wajib diisi!" });
    }

    try {
        const rows = await db.query(
            'SELECT * FROM users WHERE email = ? OR username = ?', [username, username]
        );

        if(rows.length === 0) {
            return res.status(400).json({ message: "Email atau Password salah!" })
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.pass);
        if(!match) {
            return res.status(400).json({ message: "Email atau Password salah!" });
        }

        const payload = {
            id: user.id,
            username: user.username
        };

        const isRemembered = rememberMe === 'true';
        const shortDuration = 60 * 60;
        const longDuration = 7 * 24 * 60 * 60;
        const selectedDuration = isRemembered ? longDuration : shortDuration;

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: selectedDuration
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: selectedDuration * 1000
        });

        return res.status(200).json({ message: 'Login berhasil' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Terjadi kesalahan pada database!" });
    }
});

router.post("/register", authLimiter, async (req, res) => {
    const { email, username, firstname, lastname, password } = req.body
    
    if(!email || !username || !password || !firstname || !lastname) {
        return res.status(400).json({ message: "Semua field wajib diisi!" });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        return res.status(400).json({ message: "Format email tidak valid!" });
    }
    if(password.length < 8) {
        return res.status(400).json({ message: "Password harus lebih dari 8 karakter" });
    }
    const hashPass = await bcrypt.hash(password, 10);

    try {
        const existedUser = await db.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if (existedUser.length > 0) {
            return res.status(400).json({ message: "Email terdaftar!" });
        }

        const result = await db.query(
            'INSERT INTO users (email, username, firstname, lastname, pass) VALUES (?, ?, ?, ?, ?)', [email, username, firstname, lastname, hashPass]
        );
        const newUserId = Number(result.insertId);

        const payload = {
            id:  newUserId,
            username: username
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000
        });

        return res.status(200).json({ message: 'Registrasi berhasil' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal registrasi user!" });
    }
});

router.post("/logout", verifyToken, (req, res) => {
    res.clearCookie("token");
    return res.redirect("/login");
});

router.patch("/profile", verifyToken, async (req, res) => {
    const { firstname, lastname } = req.body;

    if(!firstname || !lastname) {
        return res.status(400).json({ message: "Nama depan dan belakang wajib diisi!" });
    }

    try {
        await db.query(
            'UPDATE users SET firstname = ?, lastname = ? WHERE id = ?', [firstname, lastname, req.user.id]
        );
        return res.status(200).json({ success: true, message: "Nama berhasil diperbarui!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Gagal memperbarui nama!" });
    }
});

router.get("/profile", verifyToken, async (req, res) => {
    try {
        const rows = await db.query(
            'SELECT email, username, firstname, lastname FROM users WHERE id = ?', [req.user.id]
        );
        if(rows.length === 0) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan!" });
        }
        const user = rows[0];
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Gagal mengambil data user!" });
    }
});

export default router;