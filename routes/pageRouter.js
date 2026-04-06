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
  res.render('transaksi', { page: 'transaksi' });
});

router.get('/target', verifyToken, (req, res) => {
  const savingsGoal = [
    { nama: "Sony WH-1000XM5", icon: "🎧", progress: 28, terkumpul: 1000000, target: 3500000, textClass: "text-green-400", bgClass: "bg-green-400" },
    { nama: "Laptop Baru", icon: "💻", progress: 5, terkumpul: 500000, target: 10000000, textClass: "text-yellow-400", bgClass: "bg-yellow-400" }
  ];
  res.render('targetTabungan', { page: 'target', savingsGoal });
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

router.get("/landing", (req, res) => {
  res.render('landing', { page: 'landing' });
})

export default router;