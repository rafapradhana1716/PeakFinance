import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { page: 'dashboard' });
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

router.get("/login", (req, res) => {
    res.render('login')
});

export default router;