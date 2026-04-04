import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

router.get('/', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.render('landing', { page: 'landing' });
  }

  try {
    return res.render('index', {
      page: 'home'
    });
  } catch (err) {
    res.clearCookie('token');
    return res.render('landing', { page: 'landing' });
  }
});

router.get('/analisis', verifyToken, (req, res) => {
  res.render('analitik', { page: 'analisis' });
});

router.get('/transaksi', verifyToken, async (req, res) => {
  const rows = await db.query(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  )

  res.render('transaksi', { page: 'transaksi', transactions: rows });
});

router.get('/target', verifyToken, (req, res) => {
  res.render('targetTabungan', { page: 'target' });
});

router.get('/profil', verifyToken, (req, res) => {
  res.render('profile', { page: 'profil' });
});

router.get('/insight', verifyToken, (req, res) => {
  res.render('insight', { page: 'insight' });
});

router.get('/laporan', verifyToken, (req, res) => {

  const transaksi = [
    { nama: "Gaji", tipe: "masuk", jumlah: 5000000, tanggal: "2026-04-01" },
    { nama: "Belanja", tipe: "keluar", jumlah: 2000000, tanggal: "2026-04-02" }
  ];

  let pemasukan = 0;
  let pengeluaran = 0;

  transaksi.forEach(t => {
    if (t.tipe === "masuk") pemasukan += t.jumlah;
    else pengeluaran += t.jumlah;
  });

  const saldo = pemasukan - pengeluaran;

  res.render('laporan', {
    page: 'laporan',
    user: req.user || {
      firstname: "Guest",
      lastname: "",
      username: "guest"
    },
    transaksi,
    pemasukan,
    pengeluaran,
    saldo
  });
});

router.get('/pengaturan', verifyToken, (req, res) => {
  res.render('pengaturan', {
    page: 'pengaturan',
    user: req.user || {
      firstname: "Guest",
      lastname: "",
      username: "guest"
    }
  });
});

router.get("/login", (req, res) => {
  if (req.cookies.token) return res.redirect('/');
  res.render("auth/login", { page: "login" });
});

router.get("/register", (req, res) => {
  if (req.cookies.token) return res.redirect('/');
  res.render("auth/register", { page: "register" });
});

export default router;