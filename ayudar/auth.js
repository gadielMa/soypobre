(() => {
  const client = window.supabase?.createClient('https://jbrjsvkdnyzptkxnflbe.supabase.co', 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1');
  async function requireDonor() {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user?.user_metadata?.soypobre_donor_name) return;
    window.location.replace('/soypobre/ayudar/ingresar/');
  }
  if (client) requireDonor().catch(() => window.location.replace('/soypobre/ayudar/ingresar/'));
})();
