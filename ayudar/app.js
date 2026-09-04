document.querySelectorAll('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' }));
});

document.querySelectorAll('.filter').forEach((filter) => {
  filter.addEventListener('click', () => {
    if (filter.classList.contains('icon-filter')) return;
    document.querySelectorAll('.filter').forEach((item) => item.classList.remove('selected'));
    filter.classList.add('selected');
  });
});
