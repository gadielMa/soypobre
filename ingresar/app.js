(() => {
  const form = document.getElementById('loginForm');
  const status = document.getElementById('status');
  const client = window.supabase?.createClient(
    'https://jbrjsvkdnyzptkxnflbe.supabase.co',
    'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1'
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return;
    const button = form.querySelector('button');
    button.disabled = true;
    button.classList.add('is-loading');
    button.textContent = 'INGRESANDO...';
    status.textContent = '';
    const { error } = await client.auth.signInWithPassword({
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
    });
    if (error) {
      status.textContent = 'Email o contraseña incorrectos.';
      button.disabled = false;
      button.classList.remove('is-loading');
      button.textContent = 'INGRESAR';
      return;
    }
    window.location.assign('../perfil/');
  });
})();
