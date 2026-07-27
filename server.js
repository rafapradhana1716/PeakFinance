import express from 'express';
import usersRouter from './routes/authUser.js';
import pageRouter from './routes/pageRouter.js';
import transactionRouter from './routes/transactionsRouter.js';
import financeRouter from './routes/financeRouter.js';
import savingsRouter from './routes/savingsRouter.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import path from 'path';

const app = express();
const port = Number(process.env.PORT) || 3000;
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
requiredEnv.forEach((key) => {
    if(!process.env[key]) {
        console.error(`Error: Missing required environment variable ${key}`);
        process.exit(1);
    }
});

app.set('view engine', 'ejs');

if (process.env.JWT_SECRET.length < 32) {
    console.error('Error: JWT_SECRET minimal 32 karakter');
    process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    });
    next();
});

app.use((req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!origin) return next();

    try {
        if (new URL(origin).host === req.get('host')) return next();
    } catch {
        // Invalid Origin is rejected below.
    }
    return res.status(403).json({ message: 'Origin request tidak diizinkan.' });
});

app.use((req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const viteBaseUrl = process.env.BASEURL_VITE || 'http://localhost:5173';
    res.locals.env = {
        BASEURL_VITE: viteBaseUrl,
        CSS_URL: isProduction ? '/dist/assets/styles.css' : `${viteBaseUrl}/public/css/input.css`,
        IS_PRODUCTION: isProduction,
        PROJECT_NAME: "PeakFinance"
    };
    next();
});

app.use(express.static(path.resolve('public'), {
    etag: true,
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));
app.use("/auth", usersRouter);
app.use("/trx",transactionRouter);
app.use("/finance", financeRouter);
app.use("/savings", savingsRouter);
app.use("/", pageRouter);

app.use((req, res) => {
    res.status(404).json({ message: 'Halaman atau endpoint tidak ditemukan.' });
});

app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
