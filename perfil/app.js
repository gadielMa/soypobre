(() => {
  const profile = JSON.parse(localStorage.getItem('soypobre-profile') || 'null');
  const profileSection = document.getElementById('profile');
  const empty = document.getElementById('empty');
  const DB_NAME = 'soypobre';
  const STORE = 'pending';
  const client = window.supabase?.createClient(
    'https://jbrjsvkdnyzptkxnflbe.supabase.co',
    'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1'
  );

  function showAccount(user) {
    const name = user.user_metadata?.soypobre_name || profile?.name || user.email;
    document.querySelector('.register').hidden = true;
    document.getElementById('accountArea').hidden = false;
    document.getElementById('accountInitials').textContent = 'P';
    document.getElementById('accountName').textContent = name;
  }

  function showRegistrationNotice(existingEmail = false) {
    const eyebrow = document.getElementById('noticeEyebrow');
    const title = document.getElementById('noticeTitle');
    const text = document.getElementById('noticeText');
    const close = document.getElementById('closeNotice');
    const notice = document.getElementById('registrationNotice');
    eyebrow.hidden = existingEmail;
    text.hidden = existingEmail;
    title.innerHTML = existingEmail
      ? 'Este email ya se encuentra registrado.'
      : 'Revisá<br /><span>tu email.</span>';
    close.textContent = 'INICIAR SESIÓN';
    notice.classList.toggle('existing-email', existingEmail);
    notice.hidden = false;
  }

  async function refreshAccount() {
    if (!client) return;
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user?.user_metadata?.soypobre_name) return;
    if (profile?.name && session.user.user_metadata.soypobre_name !== profile.name) {
      const { data, error } = await client.auth.updateUser({ data: { soypobre_name: profile.name } });
      if (!error && data.user) {
        showAccount(data.user);
        return;
      }
    }
    showAccount(session.user);
  }

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

  async function getPhoto() {
    const db = await database();
    const file = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get('photo');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return file;
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

  function showValue(rowId, value) {
    const row = document.getElementById(rowId);
    if (!value) row.hidden = true;
    return row;
  }

  if (profile) {
    profileSection.hidden = false;
    empty.hidden = true;
    document.getElementById('profileAlias').textContent = profile.alias || 'No informado';
    if (profile.name) document.getElementById('profileName').textContent = profile.name;
    showValue('nameRow', profile.name);
    if (profile.story) document.getElementById('profileStory').textContent = profile.story;
    showValue('storyRow', profile.story);
    const photoRow = showValue('photoRow', profile.photoName);
    if (profile.photoName) document.getElementById('profilePhoto').textContent = profile.photoName;
    getPhoto().then((file) => {
      if (file && photoRow) {
        photoRow.hidden = false;
        const image = document.createElement('img');
        image.src = URL.createObjectURL(file);
        image.alt = 'Foto cargada';
        image.className = 'profile-image';
        document.getElementById('profilePhoto').replaceChildren(image);
      }
    }).catch(console.error);
  }

  refreshAccount().catch(console.error);
  client?.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.user_metadata?.soypobre_name) showAccount(session.user);
  });

  document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('registerStatus');
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const password = document.getElementById('password').value;
    const passwordConfirmation = document.getElementById('passwordConfirmation').value;
    if (password !== passwordConfirmation) {
      status.textContent = 'Las contraseñas no coinciden.';
      document.getElementById('passwordConfirmation').focus();
      return;
    }
    if (!client) return;
    status.textContent = '';
    button.disabled = true;
    button.classList.add('is-loading');
    button.innerHTML = '<span>REGISTRANDO</span><i aria-hidden="true"></i>';
    const { data, error } = await client.auth.signUp({
      email: document.getElementById('email').value.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/soypobre/perfil/`,
        data: { soypobre_name: profile?.name || '' },
      },
    });
    if (error) {
      status.textContent = error.message;
      button.disabled = false;
      button.classList.remove('is-loading');
      button.textContent = 'REGISTRARME';
      return;
    }
    status.textContent = '';
    button.disabled = false;
    button.classList.remove('is-loading');
    button.textContent = 'REGISTRARME';
    showRegistrationNotice(data.user?.identities?.length === 0);
  });

  document.getElementById('closeNotice')?.addEventListener('click', () => {
    window.location.assign('../ingresar/');
  });

  let editedPhoto = null;
  let editing = false;
  const editableFields = [
    ['profileAlias', 'Escribí tu alias'],
    ['profileName', 'Escribí tu nombre'],
    ['profileStory', 'Contanos de vos'],
  ];

  function showPhotoEditor(text = 'Agregar una foto') {
    const photoRow = document.getElementById('photoRow');
    const photo = document.getElementById('profilePhoto');
    photoRow.hidden = false;
    const label = document.createElement('label');
    label.className = 'edit-photo';
    label.htmlFor = 'editPhoto';
    label.innerHTML = `<span>${text}</span><strong>+</strong>`;
    photo.replaceChildren(label);
  }

  document.getElementById('editButton')?.addEventListener('click', () => {
    if (!profile) return;
    if (!editing) {
      editing = true;
      profileSection.classList.add('is-editing');
      document.getElementById('nameRow').hidden = false;
      document.getElementById('storyRow').hidden = false;
      editableFields.forEach(([id, placeholder]) => {
        const field = document.getElementById(id);
        field.contentEditable = 'true';
        field.dataset.placeholder = placeholder;
        if (field.textContent === 'No informado') field.textContent = '';
      });
      showPhotoEditor(profile.photoName ? 'Cambiar foto' : 'Agregar una foto');
      document.getElementById('editButton').textContent = 'GUARDAR CAMBIOS';
      return;
    }
    profile.alias = document.getElementById('profileAlias').textContent.trim() || null;
    profile.name = document.getElementById('profileName').textContent.trim() || null;
    profile.story = document.getElementById('profileStory').textContent.trim() || null;
    if (editedPhoto) profile.photoName = editedPhoto.name;
    localStorage.setItem('soypobre-profile', JSON.stringify(profile));
    if (editedPhoto) storePhoto(editedPhoto).catch(console.error);
    window.location.reload();
  });

  document.getElementById('editPhoto')?.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      event.target.value = '';
      showPhotoEditor('La foto debe pesar menos de 10 MB');
      return;
    }
    editedPhoto = file;
    showPhotoEditor('Foto lista para guardar');
  });

  document.getElementById('accountButton')?.addEventListener('click', () => {
    const menu = document.getElementById('accountMenu');
    menu.hidden = !menu.hidden;
    document.getElementById('accountButton').setAttribute('aria-expanded', String(!menu.hidden));
  });

  document.addEventListener('click', (event) => {
    const area = document.getElementById('accountArea');
    if (!area.hidden && !area.contains(event.target)) {
      document.getElementById('accountMenu').hidden = true;
      document.getElementById('accountButton').setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('signOutButton')?.addEventListener('click', async () => {
    await client?.auth.signOut();
    window.location.assign('../nuevo/');
  });
})();
