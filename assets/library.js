(() => {
  const search = document.querySelector('[data-library-search]');
  const type = document.querySelector('[data-library-type]');
  const domain = document.querySelector('[data-library-domain]');
  const grid = document.querySelector('[data-library-grid]');
  const count = document.querySelector('[data-library-result-count]');
  if (!grid) return;
  const entries = [...grid.querySelectorAll('[data-library-entry]')];
  const apply = () => {
    const q = String(search?.value ?? '').trim().toLowerCase();
    const selectedType = String(type?.value ?? 'ALL').toUpperCase();
    const selectedDomain = String(domain?.value ?? 'ALL');
    let visible = 0;
    for (const entry of entries) {
      const matchesQuery = !q || String(entry.dataset.librarySearch ?? '').includes(q);
      const matchesType = selectedType === 'ALL' || String(entry.dataset.libraryType ?? '').toUpperCase() === selectedType;
      const matchesDomain = selectedDomain === 'ALL' || String(entry.dataset.libraryDomain ?? '') === selectedDomain;
      const show = matchesQuery && matchesType && matchesDomain;
      entry.hidden = !show;
      if (show) visible += 1;
    }
    if (count) count.textContent = `${visible} result${visible === 1 ? '' : 's'}`;
  };
  search?.addEventListener('input', apply);
  type?.addEventListener('change', apply);
  domain?.addEventListener('change', apply);
})();
