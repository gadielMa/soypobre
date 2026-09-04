(() => {
  const photoInput = document.getElementById('photo');
  const photoLabel = document.getElementById('photo-label');
  const DB_NAME = 'soypobre';
  const STORE = 'pending';

  photoInput.addEventListener('change', () => {
    photoLabel.textContent = photoInput.files[0]?.name || '¿Querés subir una foto tuya?';
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

  window.saveAndGo = async () => {
    const alias = localStorage.getItem('soypobre-alias');
    const file = photoInput.files[0] || null;
    const profile = {
      alias: alias || null,
      name: document.getElementById('name').value.trim() || null,
      story: document.getElementById('story').value.trim() || null,
      photoName: file?.name || null,
    };
    localStorage.setItem('soypobre-profile', JSON.stringify(profile));
    const button = document.querySelector('button[onclick]');
    button.disabled = true;
    button.textContent = 'GUARDANDO...';
    try { await storePhoto(file); } catch (error) { console.error(error); }
    try { await persistProfile(profile, file); } catch (error) { console.error(error); }
    window.location.assign('../perfil/');
  };
})();
