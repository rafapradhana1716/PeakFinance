import express from "express";
import bcrypt from "bcrypt";
import db from "../config/database.js";
import jwt from "jsonwebtoken";
import { clearAuthCookie, setAuthCookie, verifyToken } from "../middleware/auth.js";
import { cleanText } from "../middleware/validation.js";
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
    const username = cleanText(req.body.username, 255);
    const { password, rememberMe } = req.body;

    if(!username || typeof password !== 'string' || !password) {
        return res.status(400).json({ message: "Email dan Password wajib diisi!" });
    }

    try {
        const rows = await db.query(
            'SELECT id, username, pass FROM users WHERE email = ? OR username = ? LIMIT 1', [username.toLowerCase(), username]
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

        setAuthCookie(res, token, selectedDuration * 1000);

        return res.status(200).json({ message: 'Login berhasil' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Terjadi kesalahan pada database!" });
    }
});

router.post("/register", authLimiter, async (req, res) => {
    const email = cleanText(req.body.email, 255)?.toLowerCase();
    const username = cleanText(req.body.username, 50);
    const firstname = cleanText(req.body.firstname, 60);
    const lastname = cleanText(req.body.lastname, 60);
    const { password } = req.body;
    
    if(!email || !username || !password || !firstname || !lastname) {
        return res.status(400).json({ message: "Semua field wajib diisi!" });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        return res.status(400).json({ message: "Format email tidak valid!" });
    }
    if(typeof password !== 'string' || password.length < 8 || password.length > 72) {
        return res.status(400).json({ message: "Password harus terdiri dari 8-72 karakter." });
    }

    try {
        const existedUser = await db.query(
            'SELECT id, email, username FROM users WHERE email = ? OR username = ? LIMIT 1', [email, username]
        );

        if (existedUser.length > 0) {
            return res.status(409).json({ message: "Email atau username sudah terdaftar!" });
        }

        const hashPass = await bcrypt.hash(password, 10);

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

        setAuthCookie(res, token, 3600000);

        return res.status(201).json({ message: 'Registrasi berhasil' });
    } catch (error) {
        if (error?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Email atau username sudah terdaftar!" });
        }
        console.error(error);
        return res.status(500).json({ message: "Gagal registrasi user!" });
    }
});

router.post("/logout", verifyToken, (req, res) => {
    clearAuthCookie(res);
    return res.redirect("/login");
});

router.patch("/profile", verifyToken, async (req, res) => {
    const firstname = cleanText(req.body.firstname, 60);
    const lastname = cleanText(req.body.lastname, 60);

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
