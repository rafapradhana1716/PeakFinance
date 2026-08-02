export const ATTACHMENT_EXTENSIONS = Object.freeze({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
});

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

export function isValidDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
        && !Number.isNaN(date.getTime())
        && date.toISOString().slice(0, 10) === value;
}

export function getTransactionError({ name, type, category, amount, description, date } = {}) {
    if (typeof name !== 'string' || !name.trim() || !type || !amount || !date) {
        return 'Nama, tipe, tanggal, dan jumlah uang wajib diisi!';
    }
    if (name.trim().length > 50) return 'Nama transaksi maksimal 50 karakter!';
    if (!['income', 'expense', 'saving'].includes(type)) return 'Tipe transaksi tidak valid!';
    if (!isValidDate(date)) return 'Tanggal transaksi tidak valid!';

    const numericAmount = Number(amount);
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0 || numericAmount > 999999999999999) {
        return 'Jumlah uang harus berupa bilangan bulat positif!';
    }
    if (category != null && (typeof category !== 'string' || category.trim().length > 50)) {
        return 'Kategori maksimal 50 karakter!';
    }
    if (description != null && (typeof description !== 'string' || description.length > 5000)) {
        return 'Catatan maksimal 5.000 karakter!';
    }
    return null;
}

export function getUploadError({ name, type, size } = {}) {
    if (typeof name !== 'string' || !name.trim() || name.length > 255) {
        return 'Nama attachment tidak valid!';
    }
    if (!ATTACHMENT_EXTENSIONS[type]) return 'Attachment hanya boleh JPG, PNG, WebP, atau PDF!';

    const numericSize = Number(size);
    if (!Number.isSafeInteger(numericSize) || numericSize <= 0 || numericSize > MAX_ATTACHMENT_SIZE) {
        return 'Ukuran attachment maksimal 5 MB!';
    }
    return null;
}

export function getStoredAttachmentError({ path, name, type } = {}, userId) {
    if (!path && !name && !type) return null;
    if (!path || typeof name !== 'string' || !name.trim() || name.length > 255 || !ATTACHMENT_EXTENSIONS[type]) {
        return 'Data attachment tidak valid!';
    }

    const extension = ATTACHMENT_EXTENSIONS[type];
    const ownedPath = new RegExp(`^${Number(userId)}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.${extension}$`);
    return ownedPath.test(path) ? null : 'Lokasi attachment tidak valid!';
}
