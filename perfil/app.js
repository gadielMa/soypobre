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

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function showAccount(user) {
    const name = user.user_metadata?.soypobre_name || profile?.name || user.email;
    document.querySelector('.register').hidden = true;
    document.getElementById('accountArea').hidden = false;
    document.getElementById('accountInitials').textContent = initials(name) || 'SP';
    document.getElementById('accountName').textContent = name;
  }

  async function refreshAccount() {
    if (!client) return;
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return;
    if (profile?.name && session.user.user_metadata?.soypobre_name !== profile.name) {
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
    if (session?.user) showAccount(session.user);
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
    const { error } = await client.auth.signUp({
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
    document.getElementById('registrationNotice').hidden = false;
  });

  document.getElementById('closeNotice')?.addEventListener('click', () => {
    document.getElementById('registrationNotice').hidden = true;
  });

  document.getElementById('accountButton')?.addEventListener('click', () => {
    const menu = document.getElementById('accountMenu');
    menu.hidden = !menu.hidden;
    document.getElementById('accountButton').setAttribute('aria-expanded', String(!menu.hidden));
  });

  document.getElementById('signOutButton')?.addEventListener('click', async () => {
    await client?.auth.signOut();
    window.location.reload();
  });
})();
