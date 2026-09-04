(() => {
  const photoInput = document.getElementById('photo');
  const photoLabel = document.getElementById('photo-label');
  const DB_NAME = 'soypobre';
  const STORE = 'pending';
  const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
  let selectedPhoto = null;

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_SIZE) {
      selectedPhoto = null;
      photoInput.value = '';
      photoLabel.textContent = 'La foto debe pesar menos de 10 MB';
      return;
    }
    selectedPhoto = file;
    photoLabel.textContent = 'Foto lista para subir';
  });

  function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function storePhoto(file) {
    const db = await database();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      file ? tx.objectStore(STORE).put(file, 'photo') : tx.objectStore(STORE).delete('photo');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  function optimizePhoto(file) {
    return new Promise((resolve) => {
      const image = new Image();
      const sourceUrl = URL.createObjectURL(file);
      image.onload = () => {
        const longestSide = Math.max(image.width, image.height);
        const scale = Math.min(1, 1600 / longestSide);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(sourceUrl);
        canvas.toBlob((blob) => {
          resolve(blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : file);
        }, 'image/jpeg', 0.82);
      };
      image.onerror = () => {
        URL.revokeObjectURL(sourceUrl);
        resolve(file);
      };
      image.src = sourceUrl;
    });
  }

  async function persistProfile(profile, file) {
    if (!profile.alias || !window.supabase) return;

    const client = window.supabase.createClient(
      'https://jbrjsvkdnyzptkxnflbe.supabase.co',
      'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1'
    );
    let photoPath = null;

    if (file) {
      photoPath = `${crypto.randomUUID()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
      const { error } = await client.storage
        .from('soypobre-images')
        .upload(photoPath, file, { contentType: file.type });
      if (error) {
        console.error(error);
        photoPath = null;
      }
    }

    const { error } = await client.from('soypobre_requests').insert({
      alias: profile.alias,
      name: profile.name,
      story: profile.story,
      photo_path: photoPath,
    });
    if (error) throw error;
    profile.photoPath = photoPath;
    localStorage.setItem('soypobre-profile', JSON.stringify(profile));
  }

  function withTimeout(promise, milliseconds) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de guardado agotado')), milliseconds)),
    ]);
  }

  window.saveAndGo = async () => {
    const alias = localStorage.getItem('soypobre-alias');
    const file = selectedPhoto;
    const button = document.querySelector('button[onclick]');
    button.disabled = true;
    button.textContent = 'GUARDANDO...';
    const optimizedFile = file ? await optimizePhoto(file) : null;
    const profile = {
      alias: alias || null,
      name: document.getElementById('name').value.trim() || null,
      story: document.getElementById('story').value.trim() || null,
      photoName: optimizedFile?.name || null,
    };
    localStorage.setItem('soypobre-profile', JSON.stringify(profile));
    try { await storePhoto(optimizedFile); } catch (error) { console.error(error); }
    try { await withTimeout(persistProfile(profile, optimizedFile), 3000); } catch (error) { console.error(error); }
    window.location.assign('../perfil/');
  };
})();
