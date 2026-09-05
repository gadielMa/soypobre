(() => {
  const url = 'https://jbrjsvkdnyzptkxnflbe.supabase.co';
  const key = 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1';
  const client = window.supabase?.createClient(url, key);
  const grid = document.getElementById('storyGrid');
  const status = document.getElementById('feedStatus');
  const dialog = document.getElementById('donationDialog');
  let selectedProfile = null;

  const escape = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const initials = (name = 'P') => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const pesos = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  async function invoke(name, options = {}) {
    const { data: { session } } = await client.auth.getSession();
    const response = await fetch(`${url}/functions/v1/${name}${options.query || ''}`, {
      method: options.method || 'GET',
      headers: { apikey: key, Authorization: `Bearer ${session?.access_token || ''}`, 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'No pudimos completar la operación.');
    return payload;
  }

  function profileLocation(profile) { return [profile.locality, profile.province, profile.country].filter(Boolean).join(' · ') || 'Argentina'; }

  function renderProfiles(profiles) {
    if (!profiles.length) { grid.innerHTML = '<p class="empty-feed">Todavía no hay historias para este territorio.</p>'; return; }
    grid.innerHTML = profiles.map((profile, index) => `<article class="story-card ${index === 0 ? 'featured' : ''}"><div class="card-photo">${profile.photo_url ? `<img class="story-image" src="${escape(profile.photo_url)}" alt="Foto de ${escape(profile.name || profile.alias || 'perfil')}" />` : `<span>${initials(profile.name || profile.alias)}</span>`}</div><div class="card-body"><p class="story-place">${escape(profileLocation(profile))}</p><h3>${escape(profile.name || profile.alias || 'Una persona necesita ayuda')}</h3><p>${escape(profile.story || 'Esta persona todavía no compartió su historia.')}</p><button type="button" data-profile-id="${profile.id}">Transferir y registrar <span>↗</span></button></div></article>`).join('');
    grid.querySelectorAll('[data-profile-id]').forEach((button) => button.addEventListener('click', () => openDonation(profiles.find((profile) => profile.id === button.dataset.profileId))));
  }

  async function loadProfiles() {
    try {
      status.textContent = 'Cargando historias reales…';
      const country = document.getElementById('feedCountry').value;
      const province = document.getElementById('feedProvince').value.trim();
      const locality = document.getElementById('feedLocality').value.trim();
      const query = `?country=${encodeURIComponent(country)}${province ? `&province=${encodeURIComponent(province)}` : ''}${locality ? `&locality=${encodeURIComponent(locality)}` : ''}`;
      const { profiles } = await invoke('soypobre-feed', { query });
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

  document.querySelectorAll('[data-scroll]').forEach((button) => button.addEventListener('click', () => document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' })));
  ['feedCountry', 'feedProvince', 'feedLocality'].forEach((id) => document.getElementById(id).addEventListener('change', loadProfiles));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  document.getElementById('donationForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const receipt = document.getElementById('donationReceipt').files[0];
    const donationStatus = document.getElementById('donationStatus');
    const button = event.currentTarget.querySelector('[type="submit"]');
    if (!selectedProfile || !receipt) return;
    button.disabled = true;
    button.textContent = 'GUARDANDO…';
    try {
      const uploaded = await window.soyPobreCloudinary.uploadImage(receipt, 'SoyPobre/comprobantes');
      await invoke('soypobre-donation', { method: 'POST', body: { recipient_id: selectedProfile.id, amount: document.getElementById('donationAmount').value, receipt_url: uploaded.url, receipt_public_id: uploaded.publicId } });
      donationStatus.style.color = '#315f45';
      donationStatus.textContent = 'Donación registrada. Ya impacta en el ranking.';
      await loadRanking();
    } catch (error) { donationStatus.textContent = error.message; }
    finally { button.disabled = false; button.textContent = 'REGISTRAR DONACIÓN'; }
  });

  loadProfiles();
  loadRanking();
})();
