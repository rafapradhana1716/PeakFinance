import express from 'express';
import usersRouter from './routes/authUser.js';
import pageRouter from './routes/pageRouter.js';
import transactionRouter from './routes/transactionsRouter.js';
import financeRouter from './routes/financeRouter.js';
import savingsRouter from './routes/savingsRouter.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// In development: embed Vite as Express middleware.
// This processes Tailwind CSS and serves /@vite/client through port 3000
// — no separate "npm run dev-vite" needed anymore.
if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
    });
    app.use(vite.middlewares);
}

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: isProd
        ? 'https://peakfinances.vercel.app'
        : 'http://localhost:3000',
    credentials: true,
}));

app.use((req, res, next) => {
    res.locals.env = {
        // Dev: empty string → relative URLs → handled by Vite middleware above
        // Prod: always empty — input.css is intercepted below and served as styles.css
        BASEURL_VITE: '',
        PROJECT_NAME: 'PeakFinance',
    };
    next();
});

app.get('/public/css/tailwindcss', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.resolve('public/css/styles.css'));
});

// Production: templates request /public/css/input.css (Vite processes it in dev),
// but in prod we serve the pre-compiled styles.css instead.
// Also silence /@vite/client — it's dev-only HMR and would 404 in production.
if (isProd) {
    app.get('/public/css/input.css', (req, res) => {
        res.setHeader('Content-Type', 'text/css');
        // Prefer the vite build output from dist (has all new classes); fallback to committed file
        const distPath = path.resolve('dist/public/css/styles.css');
        const fallbackPath = path.resolve('public/css/styles.css');
        res.sendFile(distPath, (err) => {
            if (err) res.sendFile(fallbackPath);
        });
    });
    app.get('/@vite/client', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.end('');
    });
}

app.use('/public', express.static(path.resolve('public')));
app.use(express.static(path.resolve('dist')));

app.use("/auth", usersRouter);
app.use("/trx", transactionRouter);
app.use("/finance", financeRouter);
app.use("/savings", savingsRouter);
app.use("/", pageRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
