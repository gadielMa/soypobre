const supabase = window.supabase.createClient(
  'https://jbrjsvkdnyzptkxnflbe.supabase.co',
  'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1',
);
const form = document.getElementById('detailsForm');
const photoInput = document.getElementById('photo');
const photoLabel = document.getElementById('photo-label');

photoInput.addEventListener('change', () => {
  photoLabel.textContent = photoInput.files[0]?.name || 'Elegir una foto';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const alias = localStorage.getItem('soypobre-alias');
  const name = document.getElementById('name').value.trim() || null;
  const story = document.getElementById('story').value.trim() || null;
  const file = document.getElementById('photo').files[0];
  if (!alias) return window.location.href = '../nuevo/';
  if (file && file.size > 5 * 1024 * 1024) return;
  let photoPath = null;
  if (file) {
    photoPath = `${crypto.randomUUID()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
    const upload = await supabase.storage.from('soypobre-images').upload(photoPath, file, { contentType: file.type });
    if (upload.error) return;
  }
  const result = await supabase.from('soypobre_requests').insert({ alias, name, story, photo_path: photoPath });
  if (!result.error) {
    localStorage.setItem('soypobre-profile', JSON.stringify({ alias, name, story, photoName: file?.name || null }));
    localStorage.removeItem('soypobre-alias');
    window.location.href = '../perfil/';
  }
});
