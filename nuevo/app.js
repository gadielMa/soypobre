const supabase = window.supabase.createClient(
  'https://jbrjsvkdnyzptkxnflbe.supabase.co',
  'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1',
);

document.getElementById('aliasForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const alias = document.getElementById('alias').value.trim();
  if (!alias) return;
  await supabase.from('soypobre_requests').insert({ alias });
});
