import express from 'express';
import jwt from 'jsonwebtoken';
const router = express.Router();

router.get('/', (req, res) => {
  const token = req.cookies.token;

  if(!token) {
    return res.render('landing', { page: 'landing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

router.get('/transaksi', (req, res) => {
  res.render('transaksi', { page: 'transaksi' });
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