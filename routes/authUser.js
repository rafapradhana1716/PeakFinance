import express from "express";
import bcrypt from "bcrypt";
import db from "../config/database.js";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body

    if(!username || !password) {
        return res.status(400).json({ message: "Email dan Password wajib diisi!" });
    }

    try {
        const rows = await db.query(
            'SELECT * FROM users WHERE email = ? OR user = ?', [username, username]
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
            username: user.user,
            firstname: user.firstname,
            lastname: user.lastname
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 3600000,
        });

        return res.redirect("/");

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Terjadi kesalahan pada database!" });
    }
});

router.post("/register", async (req, res) => {
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
            'INSERT INTO users (email, user, firstname, lastname, pass) VALUES (?, ?, ?, ?, ?)', [email, username, firstname, lastname, hashPass]
        );
        const newUserId = Number(result.insertId);

        const payload = {
            id:  newUserId,
            username: username,
            firstname: firstname,
            lastname: lastname
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 3600000
        });

        return res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal registrasi user!" });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout berhasil!" });
});

export default router;