export const cleanText = (value, maxLength) => {
    if (typeof value !== 'string') return null;
    const cleaned = value.trim();
    if (!cleaned || cleaned.length > maxLength) return null;
    return cleaned;
};

export const optionalText = (value, maxLength) => {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value !== 'string') return null;
    const cleaned = value.trim();
    return cleaned.length <= maxLength ? cleaned : null;
};

export const positiveAmount = (value, { allowZero = false } = {}) => {
    const amount = Number(value);
    const minimumValid = allowZero ? amount >= 0 : amount > 0;
    if (!Number.isSafeInteger(amount) || !minimumValid || amount > 999_999_999_999_999) {
        return null;
    }
    return amount;
};

export const positiveId = (value) => {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};
