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
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
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
    localStorage.setItem('soypobre-pending-profile', 'true');
    try { await storePhoto(file); } catch (error) { console.error(error); }
    window.location.assign('../perfil/');
  };
})();
