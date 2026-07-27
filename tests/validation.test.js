import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, optionalText, positiveAmount, positiveId } from '../middleware/validation.js';

test('cleanText trims valid text and rejects empty or overlong input', () => {
    assert.equal(cleanText('  Belanja  ', 20), 'Belanja');
    assert.equal(cleanText('   ', 20), null);
    assert.equal(cleanText('terlalu panjang', 5), null);
    assert.equal(cleanText(123, 20), null);
});

test('optionalText accepts empty values but rejects invalid text', () => {
    assert.equal(optionalText(undefined, 20), '');
    assert.equal(optionalText(' catatan ', 20), 'catatan');
    assert.equal(optionalText('panjang', 3), null);
});

test('positiveAmount only accepts safe, whole rupiah amounts', () => {
    assert.equal(positiveAmount('10000'), 10000);
    assert.equal(positiveAmount(0), null);
    assert.equal(positiveAmount(0, { allowZero: true }), 0);
    assert.equal(positiveAmount(-1), null);
    assert.equal(positiveAmount(1.5), null);
    assert.equal(positiveAmount('bukan angka'), null);
});

test('positiveId only accepts positive safe integers', () => {
    assert.equal(positiveId('12'), 12);
    assert.equal(positiveId(0), null);
    assert.equal(positiveId('abc'), null);
});
