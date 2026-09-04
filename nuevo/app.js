const aliasInput = document.getElementById('alias');
const supabase = window.supabase.createClient(
  'https://jbrjsvkdnyzptkxnflbe.supabase.co',
  'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1',
);

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
  await supabase.from('soypobre_requests').insert({ alias });
});
