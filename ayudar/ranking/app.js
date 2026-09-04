const label = document.getElementById('resultLabel');
const country = document.getElementById('country');
const province = document.getElementById('province');
const neighborhood = document.getElementById('neighborhood');
const period = document.getElementById('period');

function updateLabel() {
  const place = neighborhood.value !== 'Todos' ? neighborhood.value : province.value !== 'Todo el país' ? province.value : country.value;
  label.textContent = `Mayores donantes de ${place} · ${period.value.toLowerCase()}`;
}

[country, province, neighborhood, period].forEach((input) => input.addEventListener('change', updateLabel));
