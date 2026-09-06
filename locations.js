(() => {
  const endpoint = 'https://apis.datos.gob.ar/georef/api';
  const groups = new Map();
  const option = (value, label, disabled = false) => new Option(label, value, disabled, false);
  const setOptions = (select, entries, placeholder) => select.replaceChildren(option('', placeholder, true), ...entries.map(({ value, label }) => option(value, label)));

  async function provinces() {
    const response = await fetch(`${endpoint}/provincias?campos=id,nombre&max=500`);
    if (!response.ok) throw new Error('No pudimos cargar las provincias.');
    const payload = await response.json();
    return (payload.provincias || []).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  async function localities(provinceId) {
    const response = await fetch(`${endpoint}/localidades?provincia=${encodeURIComponent(provinceId)}&campos=id,nombre&max=5000`);
    if (!response.ok) throw new Error('No pudimos cargar las localidades.');
    const payload = await response.json();
    return [...new Set((payload.localidades || []).map((item) => item.nombre))].sort((a, b) => a.localeCompare(b, 'es'));
  }
  async function bind(countryId, provinceId, localityId) {
    const country = document.getElementById(countryId); const province = document.getElementById(provinceId); const locality = document.getElementById(localityId);
    if (!country || !province || !locality) return null;
    const key = `${countryId}:${provinceId}:${localityId}`;
    if (groups.has(key)) return groups.get(key);
    country.replaceChildren(option('Argentina', 'Argentina')); country.value = 'Argentina'; province.disabled = true; locality.disabled = true;
    setOptions(province, [], 'Cargando provincias…'); setOptions(locality, [], 'Elegí una provincia primero');
    const controller = {
      provinceList: [],
      async loadLocalities(preferred = '') {
        const selected = controller.provinceList.find((item) => item.nombre === province.value); if (!selected) return;
        locality.disabled = true; setOptions(locality, [], 'Cargando localidades…');
        try {
          const entries = (await localities(selected.id)).map((name) => ({ value: name, label: name }));
          setOptions(locality, entries, 'Elegí tu barrio o localidad'); locality.disabled = false;
          if (preferred && entries.some((item) => item.value === preferred)) locality.value = preferred;
        } catch { setOptions(locality, [], 'No pudimos cargar localidades'); }
      },
      async set({ province: preferredProvince = '', locality: preferredLocality = '' } = {}) {
        if (!controller.provinceList.length) await controller.ready;
        if (preferredProvince && controller.provinceList.some((item) => item.nombre === preferredProvince)) province.value = preferredProvince;
        if (province.value) await controller.loadLocalities(preferredLocality);
      },
    };
    controller.ready = provinces().then((items) => { controller.provinceList = items; setOptions(province, items.map((item) => ({ value: item.nombre, label: item.nombre })), 'Elegí tu provincia'); province.disabled = false; }).catch(() => setOptions(province, [], 'No pudimos cargar provincias'));
    province.addEventListener('change', () => controller.loadLocalities()); groups.set(key, controller); return controller;
  }
  window.soyPobreLocations = { async set(ids, values) { const controller = await bind(ids.country, ids.province, ids.locality); return controller?.set(values); } };
  document.addEventListener('DOMContentLoaded', () => window.soyPobreLocations.set({ country: 'country', province: 'province', locality: 'locality' }));
})();
