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
