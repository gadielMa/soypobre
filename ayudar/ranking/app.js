const label = document.getElementById('resultLabel');
const country = document.getElementById('country');
const province = document.getElementById('province');
const neighborhood = document.getElementById('neighborhood');
const period = document.getElementById('period');
const localities = {
  'Todo el país': ['Todos'],
  'Buenos Aires': ['Todos', 'Palermo', 'San Martín', 'La Plata'],
  Córdoba: ['Todos', 'Nueva Córdoba', 'Güemes', 'Villa Carlos Paz'],
  Mendoza: ['Todos', 'Godoy Cruz', 'Chacras de Coria', 'Ciudad de Mendoza'],
};

function updateLocalities() {
  neighborhood.replaceChildren(...localities[province.value].map((name) => new Option(name, name)));
}

function updateLabel() {
  const place = neighborhood.value !== 'Todos' ? neighborhood.value : province.value !== 'Todo el país' ? province.value : country.value;
  label.textContent = `Mayores donantes de ${place} · ${period.value.toLowerCase()}`;
}

province.addEventListener('change', () => {
  updateLocalities();
  updateLabel();
});
[country, neighborhood, period].forEach((input) => input.addEventListener('change', updateLabel));
updateLocalities();
