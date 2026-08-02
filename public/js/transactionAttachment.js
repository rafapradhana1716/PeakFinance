(function () {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  const maxSize = 5 * 1024 * 1024;

  window.uploadTransactionAttachment = async function (file) {
    if (!file) return null;
    if (!allowedTypes.has(file.type)) throw new Error('Attachment hanya boleh JPG, PNG, WebP, atau PDF.');
    if (file.size <= 0 || file.size > maxSize) throw new Error('Ukuran attachment maksimal 5 MB.');

    const signingResponse = await fetch('/trx/attachments/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
    });
    const attachment = await signingResponse.json();
    if (!signingResponse.ok) throw new Error(attachment.message || 'Gagal menyiapkan attachment.');

    const body = new FormData();
    body.append('cacheControl', '3600');
    body.append('', file);
    const uploadResponse = await fetch(attachment.signedUrl, {
      method: 'PUT',
      headers: { 'x-upsert': 'false' },
      body,
    });
    if (!uploadResponse.ok) throw new Error('Gagal mengunggah attachment.');

    return attachment;
  };
})();
