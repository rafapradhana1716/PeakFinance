import express from 'express';
import { clearAuthCookie, readToken, verifyToken } from '../middleware/auth.js';
const router = express.Router();

router.get('/', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.render('landing', { page: 'landing' });
  }

  try {
    const user = readToken(req);
    return res.render('index', {
      page: 'home',
      user
    });
  } catch (err) {
    clearAuthCookie(res);
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
  res.render('targetTabungan', { page: 'target' });
});

router.get('/profil', verifyToken, (req, res) => {
  res.redirect('/pengaturan');
});

router.get('/insight', verifyToken, (req, res) => {
  res.render('insight', { page: 'insight' });
});

router.get('/laporan', verifyToken, (req, res) => {
  res.redirect('/analisis');
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
  if (req.cookies.token) {
    try {
      readToken(req);
      return res.redirect('/');
    } catch {
      clearAuthCookie(res);
    }
  }
  res.render("auth/login", { page: "login" });
});

router.get("/register", (req, res) => {
  if (req.cookies.token) {
    try {
      readToken(req);
      return res.redirect('/');
    } catch {
      clearAuthCookie(res);
    }
  }
  res.render("auth/register", { page: "register" });
});

router.get("/landing", (req, res) => {
  res.render('landing', { page: 'landing' });
})

export default router;
