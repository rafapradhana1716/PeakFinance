import express from 'express';
import db from '../config/database.js';
const router = express.Router();

router.get('/', (req, res) => {
  const token = req.cookies.token;

  if(!token) {
    return res.render('landing', { page: 'landing' });
  }

  try {
    return res.render('index', {
      page: 'home'
    });
  }  catch (err) {
    res.clearCookie('token');
    return res.render('landing', { page: 'landing' });
  }
});

router.get('/analitik', (req, res) => {
  res.render('analitik', { page: 'analitik' });
});

router.get('/transaksi', async (req, res) => {
  const rows = await db.query(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  )

  res.render('transaksi', { page: 'transaksi', transactions: rows });
});

router.get('/target', (req, res) => {
  res.render('targetTabungan', { page: 'target' });
});

router.get('/profil', (req, res) => {
  res.render('profile', { page: 'profil' });
});

router.get('/insight', (req, res) => {
  res.render('insight', { page: 'insight' });
});

router.get("/login", (req, res) => {
  if(req.cookies.token) return res.redirect('/');
  res.render("auth/login", { page: "login" });
});

router.get("/register", (req, res) => {
  res.render("auth/register", { page: "register" });
});

export default router;