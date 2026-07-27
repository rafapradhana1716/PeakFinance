import jwt from "jsonwebtoken";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
};

export const setAuthCookie = (res, token, maxAge) => {
    res.cookie("token", token, { ...cookieOptions, maxAge });
};

export const clearAuthCookie = (res) => {
    res.clearCookie("token", cookieOptions);
};

export const readToken = (req) => {
    const token = req.cookies?.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
};

const rejectAuthentication = (req, res) => {
    clearAuthCookie(res);
    const isApiRequest = ['/auth', '/trx', '/finance', '/savings'].includes(req.baseUrl)
        && !(req.baseUrl === '/auth' && req.path === '/logout');
    if (isApiRequest) {
        return res.status(401).json({ success: false, message: 'Sesi berakhir. Silakan login kembali.' });
    }
    return res.redirect('/login');
};

export const verifyToken = (req, res, next) => {
    if(!req.cookies?.token) {
        return rejectAuthentication(req, res);
    }

    try {
        const decoded = readToken(req);
        req.user = decoded;
        res.locals.user = decoded;
        next();
    } catch (err) {
        return rejectAuthentication(req, res);
    }
};
