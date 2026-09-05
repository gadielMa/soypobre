(() => {
  const url = 'https://jbrjsvkdnyzptkxnflbe.supabase.co';
  const key = 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1';
  const client = window.supabase?.createClient(url, key);
  const label = document.getElementById('resultLabel');
  const country = document.getElementById('country');
  const province = document.getElementById('province');
  const neighborhood = document.getElementById('neighborhood');
  const period = document.getElementById('period');
  const localities = { 'Todo el país': ['Todos'], 'Buenos Aires': ['Todos', 'Palermo', 'San Martín', 'La Plata'], Córdoba: ['Todos', 'Nueva Córdoba', 'Güemes', 'Villa Carlos Paz'], Mendoza: ['Todos', 'Godoy Cruz', 'Chacras de Coria', 'Ciudad de Mendoza'] };
  const pesos = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
  const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  function updateLocalities() { neighborhood.replaceChildren(...(localities[province.value] || ['Todos']).map((name) => new Option(name, name))); }
  function updateLabel() { const place = neighborhood.value !== 'Todos' ? neighborhood.value : province.value !== 'Todo el país' ? province.value : country.value; label.textContent = `Mayores donantes de ${place} · ${period.value.toLowerCase()}`; }
  async function invoke() {
    const { data: { session } } = await client.auth.getSession();
    const query = new URLSearchParams({ country: country.value, period: period.value === 'Este mes' ? 'month' : period.value === 'Últimos 3 meses' ? 'quarter' : 'all' });
    if (province.value !== 'Todo el país') query.set('province', province.value);
    if (neighborhood.value !== 'Todos') query.set('locality', neighborhood.value);
    const response = await fetch(`${url}/functions/v1/soypobre-ranking?${query}`, { headers: { apikey: key, Authorization: `Bearer ${session?.access_token || ''}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'No pudimos cargar el ranking.');
    return payload.ranking || [];
  }
  function card(entry, position) { return `<article class="${position}"><span class="place">${String(entry.rank).padStart(2, '0')}</span><div class="avatar ${['coral', 'violet', 'yellow'][entry.rank % 3]}">${initials(entry.name)}</div><h2>${entry.name}</h2><p>${entry.recipients} personas ayudadas</p><strong>${pesos(entry.amount)} donados</strong></article>`; }
  async function load() {
    updateLabel();
    try {
      const ranking = await invoke();
      document.querySelector('.demo').textContent = ranking.length ? 'Ranking actualizado con donaciones y comprobantes cargados.' : 'Todavía no hay donaciones registradas para este territorio.';
      const top = ranking.slice(0, 3);
      document.querySelector('.podium').innerHTML = top.length ? [top[1] && card(top[1], 'second'), top[0] && card(top[0], 'first'), top[2] && card(top[2], 'third')].filter(Boolean).join('') : '';
      document.querySelector('.list').innerHTML = ranking.slice(3).map((entry) => `<article><b>${String(entry.rank).padStart(2, '0')}</b><span class="avatar green">${initials(entry.name)}</span><div><h3>${entry.name}</h3><p>${entry.recipients} personas ayudadas</p></div><strong>${pesos(entry.amount)} donados</strong></article>`).join('');
    } catch (error) { document.querySelector('.demo').textContent = error.message; }
  }
  province.addEventListener('change', () => { updateLocalities(); load(); });
  [country, neighborhood, period].forEach((input) => input.addEventListener('change', load));
  updateLocalities(); load();
})();
