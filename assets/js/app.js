const fallbackData = null;
let siteData = null;

async function loadData() {
  const local = localStorage.getItem('isnjSiteData');
  if (local) return JSON.parse(local);
  try {
    const response = await fetch('data/site.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load data/site.json');
    return await response.json();
  } catch (error) {
    const embedded = document.getElementById('site-json');
    return embedded ? JSON.parse(embedded.textContent) : {};
  }
}

function text(selector, value) {
  document.querySelectorAll(selector).forEach(el => { el.textContent = value || ''; });
}

function html(selector, value) {
  document.querySelectorAll(selector).forEach(el => { el.innerHTML = value || ''; });
}

function renderShared(data) {
  const s = data.settings || {};
  document.title = s.siteName || 'ISNJ IEC School';
  text('[data-site-name]', s.siteName);
  text('[data-tagline]', s.tagline);
  text('[data-address]', s.address);
  text('[data-phone]', s.phone);
  text('[data-email]', s.email);
  text('[data-office-hours]', s.officeHours);
  text('[data-school-hours]', s.schoolHours);
  text('[data-admissions-status]', s.admissionsStatus);
  const year = new Date().getFullYear();
  text('[data-year]', year);
}

function renderHome(data) {
  const s = data.settings || {};
  text('[data-hero-title]', s.heroTitle);
  text('[data-hero-subtitle]', s.heroSubtitle);
  const programs = document.getElementById('programs');
  if (programs) {
    programs.innerHTML = (data.programs || []).map(p => `
      <div class="card">
        <div class="card-icon">${escapeHtml(p.icon || '•')}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
      </div>`).join('');
  }
  const faqs = document.getElementById('faqs');
  if (faqs) {
    faqs.innerHTML = (data.faqs || []).map(f => `
      <details>
        <summary>${escapeHtml(f.question)}</summary>
        <p>${escapeHtml(f.answer)}</p>
      </details>`).join('');
  }
}

function renderPage(data) {
  const node = document.querySelector('[data-page]');
  if (!node) return;
  const slug = node.dataset.page;
  const page = (data.pages || {})[slug] || { title: 'Page Not Found', body: 'This page does not exist yet.' };
  text('[data-page-title]', page.title);
  html('[data-page-body]', escapeHtml(page.body).replaceAll('\n', '<br>'));
}

function renderTuition(data) {
  const box = document.getElementById('tuition');
  if (!box) return;
  box.innerHTML = (data.tuition || []).map(item => `
    <div class="tuition-row">
      <div><strong>${escapeHtml(item.label)}</strong><br><small>${escapeHtml(item.note || '')}</small></div>
      <span>${escapeHtml(item.amount)}</span>
    </div>`).join('');
}

function handleForms(data) {
  document.querySelectorAll('form[data-static-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const required = [...form.querySelectorAll('[required]')];
      const missing = required.filter(input => !input.value.trim());
      const message = form.querySelector('[data-form-message]');
      if (missing.length) {
        message.className = 'error';
        message.textContent = 'Please complete all required fields.';
        missing[0].focus();
        return;
      }
      const submissions = JSON.parse(localStorage.getItem('isnjFormSubmissions') || '[]');
      submissions.push({ type: form.dataset.staticForm, createdAt: new Date().toISOString(), fields: Object.fromEntries(new FormData(form)) });
      localStorage.setItem('isnjFormSubmissions', JSON.stringify(submissions));
      message.className = 'success';
      message.textContent = form.dataset.success || 'Submitted successfully.';
      form.reset();
    });
  });
}

function renderAdmin(data) {
  const editor = document.getElementById('json-editor');
  if (!editor) return;
  editor.value = JSON.stringify(data, null, 2);
  document.getElementById('save-json').addEventListener('click', () => {
    const status = document.getElementById('admin-status');
    try {
      const parsed = JSON.parse(editor.value);
      localStorage.setItem('isnjSiteData', JSON.stringify(parsed));
      status.className = 'success';
      status.textContent = 'Saved in this browser. To publish permanently, copy this JSON into data/site.json.';
    } catch (error) {
      status.className = 'error';
      status.textContent = 'Invalid JSON. Please fix the formatting and try again.';
    }
  });
  document.getElementById('reset-json').addEventListener('click', () => {
    localStorage.removeItem('isnjSiteData');
    location.reload();
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('show');
}

loadData().then(data => {
  siteData = data;
  renderShared(data);
  renderHome(data);
  renderPage(data);
  renderTuition(data);
  handleForms(data);
  renderAdmin(data);
});
