(() => {
  const url = 'https://jbrjsvkdnyzptkxnflbe.supabase.co';
  const key = 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1';
  const client = window.supabase?.createClient(url, key);
  const grid = document.getElementById('storyGrid');
  const status = document.getElementById('feedStatus');
  const dialog = document.getElementById('donationDialog');
  const donorProfileDialog = document.getElementById('donorProfileDialog');
  let selectedProfile = null;
  let currentUser = null;

  const escape = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const initials = (name = 'P') => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const pesos = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  async function invoke(name, options = {}) {
    const { data: { session } } = await client.auth.getSession();
    currentUser = session?.user || currentUser;
    const response = await fetch(`${url}/functions/v1/${name}${options.query || ''}`, {
      method: options.method || 'GET',
      headers: { apikey: key, Authorization: `Bearer ${session?.access_token || ''}`, 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'No pudimos completar la operación.');
    return payload;
  }

  function renderProfiles(profiles) {
    if (!profiles.length) { grid.innerHTML = '<p class="empty-feed">Todavía no hay historias para este territorio.</p>'; return; }
    grid.innerHTML = profiles.map((profile, index) => `<article class="story-card ${index === 0 ? 'featured' : ''}"><div class="card-photo">${profile.photo_url ? `<img class="story-image" src="${escape(profile.photo_url)}" alt="Foto de ${escape(profile.name || profile.alias || 'perfil')}" />` : `<span>${initials(profile.name || profile.alias)}</span>`}</div><div class="card-body"><h3><span class="text-chip">${escape(profile.name || profile.alias || 'Una persona necesita ayuda')}</span></h3><p class="story-summary"><span class="text-chip">${escape(profile.story || 'Esta persona todavía no compartió su historia.')}</span></p><button type="button" data-profile-id="${profile.id}"><span class="text-chip">Transferir y registrar</span><span class="button-arrow">↗</span></button></div></article>`).join('');
    grid.querySelectorAll('[data-profile-id]').forEach((button) => button.addEventListener('click', () => openDonation(profiles.find((profile) => profile.id === button.dataset.profileId))));
  }

  async function loadProfiles() {
    try {
      status.textContent = 'Cargando historias reales…';
      const { profiles } = await invoke('soypobre-feed');
      renderProfiles(profiles || []);
      status.textContent = `${profiles?.length || 0} historia${profiles?.length === 1 ? '' : 's'} disponible${profiles?.length === 1 ? '' : 's'}.`;
    } catch (error) { status.textContent = error.message; }
  }

  function openDonation(profile) {
    selectedProfile = profile;
    document.getElementById('donationName').textContent = profile.name || profile.alias || 'Esta persona';
    const payment = profile.alias ? `Alias: ${profile.alias}` : `CBU: ${profile.cbu || 'No informado'}`;
    document.getElementById('donationPayment').textContent = payment;
    const copy = document.getElementById('copyAlias');
    copy.textContent = `Copiar ${profile.alias ? 'alias' : 'CBU'}`;
    copy.href = '#';
    copy.onclick = async (event) => { event.preventDefault(); await navigator.clipboard?.writeText(profile.alias || profile.cbu || ''); copy.textContent = 'Copiado'; };
    document.getElementById('donationForm').reset();
    document.getElementById('receiptFileName').textContent = 'Sólo para completar el registro · no se guarda';
    document.getElementById('donationStatus').textContent = '';
    dialog.showModal();
  }

  async function loadRanking() {
    try {
      const { ranking } = await invoke('soypobre-ranking', { query: '?country=Argentina&period=month' });
      const list = document.getElementById('rankingList');
      list.innerHTML = ranking?.length ? ranking.slice(0, 5).map((entry, index) => `<li class="leader ${index === 0 ? 'first' : ''}"><b>${String(entry.rank).padStart(2, '0')}</b><span class="donor-avatar ${['coral', 'blue', 'yellow', 'green'][index % 4]}">${initials(entry.name)}</span><strong>${escape(entry.name)}</strong><small>${entry.recipients} persona${entry.recipients === 1 ? '' : 's'} ayudadas</small><em>${pesos(entry.amount)}</em></li>`).join('') : '<li class="leader"><strong>Todavía no hay donaciones registradas.</strong></li>';
    } catch { /* The feed remains usable even if the optional summary is unavailable. */ }
  }

  async function setupAccount() {
    const { data: { session } } = await client.auth.getSession();
    currentUser = session?.user || null;
    if (!currentUser) return;
    const metadata = currentUser.user_metadata || {};
    document.getElementById('donorAccount').hidden = false;
    document.getElementById('accountName').textContent = metadata.soypobre_donor_name || currentUser.email;
    document.getElementById('accountButton').textContent = initials(metadata.soypobre_donor_name || 'P');
    document.getElementById('donorName').value = metadata.soypobre_donor_name || '';
    document.getElementById('donorCountry').value = metadata.soypobre_donor_country || 'Argentina';
    document.getElementById('donorProvince').value = metadata.soypobre_donor_province || '';
    document.getElementById('donorLocality').value = metadata.soypobre_donor_locality || '';
    window.soyPobreLocations?.set(
      { country: 'donorCountry', province: 'donorProvince', locality: 'donorLocality' },
      { province: metadata.soypobre_donor_province || '', locality: metadata.soypobre_donor_locality || '' },
    );
  }

  document.querySelectorAll('[data-scroll]').forEach((button) => button.addEventListener('click', () => document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' })));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  donorProfileDialog.querySelector('.dialog-close').addEventListener('click', () => donorProfileDialog.close());
  document.getElementById('accountButton').addEventListener('click', () => {
    const menu = document.getElementById('accountMenu');
    menu.hidden = !menu.hidden;
  });
  document.getElementById('editDonorButton').addEventListener('click', () => { document.getElementById('accountMenu').hidden = true; donorProfileDialog.showModal(); });
  document.getElementById('logoutDonorButton').addEventListener('click', async () => { await client.auth.signOut(); window.location.assign('/soypobre/ayudar/ingresar/'); });
  document.getElementById('donorProfileForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('donorProfileStatus');
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await invoke('soypobre-donor-profile', { method: 'POST', body: { name: document.getElementById('donorName').value, country: document.getElementById('donorCountry').value, province: document.getElementById('donorProvince').value, locality: document.getElementById('donorLocality').value } });
      await client.auth.refreshSession();
      await setupAccount();
      status.style.color = '#315f45';
      status.textContent = 'Datos guardados.';
      await loadRanking();
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
  document.getElementById('donationReceipt').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById('receiptFileName').textContent = file.name;
  });
  document.getElementById('donationForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const receipt = document.getElementById('donationReceipt').files[0];
    const donationStatus = document.getElementById('donationStatus');
    const button = event.currentTarget.querySelector('[type="submit"]');
    if (!selectedProfile || !receipt) return;
    if (receipt.size > 10 * 1024 * 1024) {
      donationStatus.textContent = 'El comprobante debe pesar menos de 10 MB.';
      return;
    }
    button.disabled = true;
    button.textContent = 'GUARDANDO…';
    try {
      await invoke('soypobre-donation', { method: 'POST', body: { recipient_id: selectedProfile.id, amount: document.getElementById('donationAmount').value } });
      donationStatus.style.color = '#315f45';
      donationStatus.textContent = 'Donación registrada. Ya impacta en el ranking.';
      dialog.close();
      window.location.assign('ranking/');
      return;
    } catch (error) { donationStatus.textContent = error.message; }
    finally { button.disabled = false; button.textContent = 'REGISTRAR DONACIÓN'; }
  });

  setupAccount();
  loadProfiles();
  loadRanking();
})();
