import { randomUUID } from 'node:crypto';
import express from 'express';
import db from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
import {
    ATTACHMENT_EXTENSIONS,
    getStoredAttachmentError,
    getTransactionError,
    getUploadError,
} from '../lib/transactionValidation.js';

const router = express.Router();
const storageBucket = () => process.env.SUPABASE_STORAGE_BUCKET || 'transaction-attachments';
const storageBaseUrl = () => `${process.env.SUPABASE_URL?.replace(/\/$/, '')}/storage/v1`;
const encodeStoragePath = value => value.split('/').map(encodeURIComponent).join('/');

function storageConfigured() {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function storageRequest(path, options = {}) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return fetch(`${storageBaseUrl()}${path}`, {
        ...options,
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            ...options.headers,
        },
    });
}

async function deleteStorageObject(path) {
    if (!path || !storageConfigured()) return;

    const response = await storageRequest(`/object/${encodeURIComponent(storageBucket())}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [path] }),
    });
    if (!response.ok) throw new Error(`Storage delete failed (${response.status})`);
}

router.post('/attachments/upload-url', verifyToken, async (req, res) => {
    const error = getUploadError(req.body);
    if (error) return res.status(400).json({ message: error });
    if (!storageConfigured()) {
        return res.status(503).json({ message: 'Penyimpanan attachment belum dikonfigurasi.' });
    }

    const name = req.body.name.trim();
    const type = req.body.type;
    const path = `${req.user.id}/${randomUUID()}.${ATTACHMENT_EXTENSIONS[type]}`;

    try {
        const response = await storageRequest(
            `/object/upload/sign/${encodeURIComponent(storageBucket())}/${encodeStoragePath(path)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
            },
        );
        const data = await response.json();
        if (!response.ok || !data.url) throw new Error(`Storage signing failed (${response.status})`);

        // ponytail: abandoned signed uploads can orphan files; add bucket lifecycle cleanup when volume matters.
        return res.json({
            signedUrl: data.url.startsWith('http') ? data.url : `${storageBaseUrl()}${data.url}`,
            path,
            name,
            type,
        });
    } catch (err) {
        console.error('Attachment upload URL error:', err);
        return res.status(502).json({ message: 'Gagal menyiapkan upload attachment.' });
    }
});

router.post('/transactions', verifyToken, async (req, res) => {
    const transactionError = getTransactionError(req.body);
    if (transactionError) return res.status(400).json({ message: transactionError });
    if (req.body.type === 'saving') {
        return res.status(400).json({ message: 'Transaksi tabungan harus dibuat dari target tabungan.' });
    }

    const attachment = {
        path: req.body.attachmentPath,
        name: req.body.attachmentName,
        type: req.body.attachmentType,
    };
    const attachmentError = getStoredAttachmentError(attachment, req.user.id);
    if (attachmentError) return res.status(400).json({ message: attachmentError });

    const { name, type, category, amount, description, date } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO transactions
            (user_id, name, type, category, amount, description, attachment_path, attachment_name, attachment_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                name.trim(),
                type,
                category?.trim() || null,
                Number(amount),
                description?.trim() || '',
                attachment.path || null,
                attachment.name?.trim() || null,
                attachment.type || null,
                date,
            ],
        );
        return res.status(201).json({ success: true, id: Number(result.insertId) });
    } catch (err) {
        if (attachment.path) await deleteStorageObject(attachment.path).catch(console.error);
        console.error('Create transaction error:', err);
        return res.status(500).json({ message: 'Gagal menambahkan transaksi!' });
    }
});

router.get('/transactions', verifyToken, async (req, res) => {
    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    try {
        const rows = await db.query(
            `SELECT id, name, type, category, amount,
                DATE_FORMAT(created_at, '%Y-%m-%d') AS transaction_date
            FROM transactions
            WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY created_at DESC`,
            [req.user.id, days],
        );
        return res.json({ success: true, transactions: rows });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data' });
    }
});

router.get('/transactions/:id/attachment', verifyToken, async (req, res) => {
    if (!storageConfigured()) return res.status(503).send('Penyimpanan attachment belum dikonfigurasi.');
    if (!/^\d+$/.test(req.params.id)) return res.status(404).send('Attachment tidak ditemukan.');

    try {
        const rows = await db.query(
            'SELECT attachment_path, attachment_name, attachment_type FROM transactions WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id],
        );
        if (rows.length === 0 || !rows[0].attachment_path) return res.status(404).send('Attachment tidak ditemukan.');

        const attachment = {
            path: rows[0].attachment_path,
            name: rows[0].attachment_name,
            type: rows[0].attachment_type,
        };
        if (getStoredAttachmentError(attachment, req.user.id)) return res.status(404).send('Attachment tidak ditemukan.');

        const response = await storageRequest(
            `/object/sign/${encodeURIComponent(storageBucket())}/${encodeStoragePath(attachment.path)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expiresIn: 60 }),
            },
        );
        const data = await response.json();
        if (!response.ok || !data.signedURL) throw new Error(`Storage download signing failed (${response.status})`);

        return res.redirect(302, `${storageBaseUrl()}${data.signedURL}`);
    } catch (err) {
        console.error('Attachment download error:', err);
        return res.status(502).send('Gagal membuka attachment.');
    }
});

router.patch('/transactions/:id', verifyToken, async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });

    const transactionError = getTransactionError(req.body);
    if (transactionError) return res.status(400).json({ message: transactionError });

    const newAttachment = {
        path: req.body.attachmentPath,
        name: req.body.attachmentName,
        type: req.body.attachmentType,
    };
    const attachmentError = getStoredAttachmentError(newAttachment, req.user.id);
    if (attachmentError) return res.status(400).json({ message: attachmentError });

    let connection;
    let oldAttachmentPath = null;
    let nextAttachmentPath = null;
    let committed = false;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const rows = await connection.query(
            `SELECT type, amount, savings_goal_id, attachment_path, attachment_name, attachment_type
            FROM transactions WHERE id = ? AND user_id = ? FOR UPDATE`,
            [req.params.id, req.user.id],
        );

        if (rows.length === 0) {
            await connection.rollback();
            if (newAttachment.path) await deleteStorageObject(newAttachment.path).catch(console.error);
            return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
        }

        const existing = rows[0];
        if (req.body.type === 'saving' && existing.type !== 'saving') {
            await connection.rollback();
            if (newAttachment.path) await deleteStorageObject(newAttachment.path).catch(console.error);
            return res.status(400).json({ message: 'Transaksi biasa tidak bisa diubah menjadi tabungan.' });
        }

        oldAttachmentPath = existing.attachment_path;
        let nextAttachmentName = existing.attachment_name;
        let nextAttachmentType = existing.attachment_type;
        nextAttachmentPath = oldAttachmentPath;

        if (newAttachment.path) {
            nextAttachmentPath = newAttachment.path;
            nextAttachmentName = newAttachment.name.trim();
            nextAttachmentType = newAttachment.type;
        } else if (req.body.removeAttachment === true || req.body.removeAttachment === 'true') {
            nextAttachmentPath = null;
            nextAttachmentName = null;
            nextAttachmentType = null;
        }

        const amount = Number(req.body.amount);
        if (existing.savings_goal_id) {
            const oldContribution = existing.type === 'saving' ? Number(existing.amount) : 0;
            const newContribution = req.body.type === 'saving' ? amount : 0;
            const difference = newContribution - oldContribution;

            if (difference !== 0) {
                await connection.query(
                    `UPDATE savings_goals
                    SET current_amount = GREATEST(0, current_amount + ?),
                        status = CASE
                            WHEN GREATEST(0, current_amount + ?) >= target_amount THEN 'achieved'
                            ELSE 'active'
                        END
                    WHERE id = ? AND user_id = ?`,
                    [difference, difference, existing.savings_goal_id, req.user.id],
                );
            }
        }

        await connection.query(
            `UPDATE transactions
            SET name = ?, type = ?, category = ?, amount = ?, description = ?, savings_goal_id = ?,
                attachment_path = ?, attachment_name = ?, attachment_type = ?, created_at = ?
            WHERE id = ? AND user_id = ?`,
            [
                req.body.name.trim(),
                req.body.type,
                req.body.category?.trim() || null,
                amount,
                req.body.description?.trim() || '',
                req.body.type === 'saving' ? existing.savings_goal_id : null,
                nextAttachmentPath,
                nextAttachmentName,
                nextAttachmentType,
                req.body.date,
                req.params.id,
                req.user.id,
            ],
        );

        await connection.commit();
        committed = true;

        if (oldAttachmentPath && oldAttachmentPath !== nextAttachmentPath) {
            await deleteStorageObject(oldAttachmentPath).catch(err => console.error('Old attachment cleanup error:', err));
        }
        return res.json({ success: true, message: 'Transaksi berhasil diperbarui.' });
    } catch (err) {
        if (!committed && connection) await connection.rollback().catch(() => {});
        if (newAttachment.path && newAttachment.path !== oldAttachmentPath) {
            await deleteStorageObject(newAttachment.path).catch(console.error);
        }
        console.error('Update transaction error:', err);
        return res.status(500).json({ message: 'Gagal memperbarui transaksi!' });
    } finally {
        connection?.release();
    }
});

export default router;
