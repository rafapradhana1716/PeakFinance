import assert from 'assert';
import {
    getStoredAttachmentError,
    getTransactionError,
    getUploadError,
    isValidDate,
} from '../lib/transactionValidation.js';

assert.strictEqual(isValidDate('2024-02-29'), true);
assert.strictEqual(isValidDate('2025-02-29'), false);
assert.strictEqual(isValidDate('02/08/2026'), false);
assert.strictEqual(getTransactionError({
    name: 'Belanja',
    type: 'expense',
    category: 'Makanan',
    amount: '50000',
    description: '',
    date: '2026-08-02',
}), null);
assert.strictEqual(getTransactionError({ name: 'Belanja', type: 'expense', amount: '-1', date: '2026-08-02' }), 'Jumlah uang harus berupa bilangan bulat positif!');
assert.strictEqual(getUploadError({ name: 'nota.png', type: 'image/png', size: 5 * 1024 * 1024 }), null);
assert.strictEqual(getUploadError({ name: 'video.mp4', type: 'video/mp4', size: 1000 }), 'Attachment hanya boleh JPG, PNG, WebP, atau PDF!');
assert.strictEqual(getStoredAttachmentError({
    path: '7/550e8400-e29b-41d4-a716-446655440000.png',
    name: 'nota.png',
    type: 'image/png',
}, 7), null);

console.log('Transaction validation passed.');
