(() => {
const profile = JSON.parse(localStorage.getItem('soypobre-profile') || 'null');
const profileSection = document.getElementById('profile');
const empty = document.getElementById('empty');

if (profile?.alias) {
  profileSection.hidden = false;
  empty.hidden = true;
  document.getElementById('profileAlias').textContent = profile.alias;
  if (profile.name) document.getElementById('profileName').textContent = profile.name;
  else document.getElementById('nameRow').hidden = true;
  if (profile.story) document.getElementById('profileStory').textContent = profile.story;
  else document.getElementById('storyRow').hidden = true;
  if (profile.photoName) document.getElementById('profilePhoto').textContent = profile.photoName;
  else document.getElementById('photoRow').hidden = true;
}

if (profile?.alias && localStorage.getItem('soypobre-pending-profile') === 'true') {
  const supabase = window.supabase.createClient(
    'https://jbrjsvkdnyzptkxnflbe.supabase.co',
    'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1',
  );
  supabase.from('soypobre_requests').insert({ alias: profile.alias, name: profile.name || null, story: profile.story || null }).then(({ error }) => {
    if (!error) localStorage.removeItem('soypobre-pending-profile');
    else console.error(error);
  });
}

const registerForm = document.getElementById('registerForm');
registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('registerStatus');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  status.textContent = 'Registrando...';
  const supabase = window.supabase.createClient(
    'https://jbrjsvkdnyzptkxnflbe.supabase.co',
    'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1',
  );
  const { error } = await supabase.auth.signUp({ email, password });
  status.textContent = error ? error.message : 'Revisá tu correo para confirmar el registro.';
});
})();
