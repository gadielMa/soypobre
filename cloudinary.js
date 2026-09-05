(() => {
  const cloudName = 'dhiyjccg';
  const uploadPreset = 'soy_pobre';
  const assetFolder = 'SoyPobre';

  async function uploadProfileImage(file) {
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', uploadPreset);
    body.append('folder', assetFolder);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.message || 'No pudimos subir la foto.');
    return { url: payload.secure_url, publicId: payload.public_id };
  }

  window.soyPobreCloudinary = { uploadProfileImage };
})();
