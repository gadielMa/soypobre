(() => {
  const client = window.supabase?.createClient('https://jbrjsvkdnyzptkxnflbe.supabase.co', 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1');
  function hasCompleteDonorProfile(user) {
    const metadata = user?.user_metadata || {};
    return Boolean(user?.email_confirmed_at) && ['soypobre_donor_name', 'soypobre_donor_country', 'soypobre_donor_province', 'soypobre_donor_locality']
      .every((field) => typeof metadata[field] === 'string' && metadata[field].trim());
  }
  async function requireDonor() {
    const { data: { session } } = await client.auth.getSession();
    if (hasCompleteDonorProfile(session?.user)) return;
    window.location.replace('/soypobre/ayudar/ingresar/');
  }
  if (client) requireDonor().catch(() => window.location.replace('/soypobre/ayudar/ingresar/'));
})();
