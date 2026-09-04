(() => {
const aliasInput = document.getElementById('alias');

function fitAlias() {
  const maxSize = Math.min(96, window.innerWidth * 0.07);
  const minSize = 22;
  const available = aliasInput.clientWidth || 900;
  let size = maxSize;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `700 ${size}px Arial`;
  while (aliasInput.value && context.measureText(aliasInput.value).width > available && size > minSize) {
    size -= 1;
    context.font = `700 ${size}px Arial`;
  }
  aliasInput.style.fontSize = `${size}px`;
}

aliasInput.addEventListener('input', fitAlias);
window.addEventListener('resize', fitAlias);
fitAlias();

document.getElementById('aliasForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const alias = document.getElementById('alias').value.trim();
  if (!alias) return;
  localStorage.setItem('soypobre-alias', alias);
  window.location.href = '../listo/';
});
})();
