// CAMBIAR AQUÍ: URL base del backend si cambia el puerto o dominio.
const API_BASE = 'http://localhost:4000/api';
let csrfToken = '';
let currentUser = null;

const $ = (selector, root = document) => root.querySelector(selector);

async function getCsrf() {
  const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
}

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    'CSRF-Token': csrfToken,
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Error inesperado');
  return data;
}

function escapeHtml(v = '') {
  return String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function canModerate() {
  return currentUser && currentUser.rol === 'admin';
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('es-AR');
}

function getYouTubeEmbed(url = '') {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.replace('/', '')}`;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/^\/embed\/([^/?]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
      const s = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (s) return `https://www.youtube.com/embed/${s[1]}`;
    }
  } catch (_) {
    return null;
  }
  return null;
}

function mediaPreviewHtml(url = '') {
  const safe = escapeHtml(url.trim());
  if (!safe) return '<small>Sin vista previa.</small>';

  const ytEmbed = getYouTubeEmbed(url);
  if (ytEmbed) return `<iframe src="${escapeHtml(ytEmbed)}" title="YouTube preview" loading="lazy" allowfullscreen></iframe>`;

  if (/drive\.google\.com/i.test(url)) {
    return `<a href="${safe}" target="_blank" rel="noreferrer">Abrir media de Drive</a>`;
  }

  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
    return `<img src="${safe}" alt="preview media" />`;
  }

  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(url)) {
    return `<video controls src="${safe}"></video>`;
  }

  return `<a href="${safe}" target="_blank" rel="noreferrer">Abrir media</a>`;
}

function setupMenu() {
  const menuBtn = $('#menuToggle');
  const nav = $('#mainNav');
  if (!menuBtn || !nav) return;
  menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
}

function ensureLogoutButton() {
  const sessionActions = $('#sessionActions');
  let logoutBtn = $('#logoutBtn');

  if (!logoutBtn && sessionActions) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.type = 'button';
    logoutBtn.textContent = 'Cerrar sesión';
    sessionActions.appendChild(logoutBtn);
  }

  return logoutBtn;
}

async function loadPublicData() {
  const about = await api('/public/about', { method: 'GET' });
  if ($('#aboutTitle')) $('#aboutTitle').textContent = about.titulo || '';
  if ($('#aboutDescription')) $('#aboutDescription').textContent = about.descripcion || '';
  if ($('#aboutImage') && about.imagen_url) $('#aboutImage').src = about.imagen_url;
}

function renderRows(target, rows, mapper, emptyCols = 5) {
  if (!target) return;
  target.innerHTML = rows.map(mapper).join('') || `<tr><td colspan="${emptyCols}">Sin datos</td></tr>`;
}

function adminDeleteButton(type, id) {
  if (!canModerate()) return '';
  return `<button type="button" class="danger-btn" data-action="admin-delete" data-type="${type}" data-id="${id}">Eliminar</button>`;
}

function ownerDeleteButton(type, id, ownerId) {
  if (!currentUser || Number(ownerId) !== Number(currentUser.id)) return '';
  return `<button type="button" class="danger-btn" data-action="owner-delete" data-type="${type}" data-id="${id}">Eliminar</button>`;
}

function renderAnnouncements(list = []) {
  const wrap = $('#announcements');
  if (!wrap) return;

  wrap.innerHTML =
    list
      .map(
        (a) => `
      <article class="announcement-card">
        <h4>${escapeHtml(a.titulo || '')}</h4>
        ${a.subtitulo ? `<h5>${escapeHtml(a.subtitulo)}</h5>` : ''}
        <p>${escapeHtml(a.contenido || '')}</p>
        ${a.link ? `<p><a href="${escapeHtml(a.link)}" target="_blank" rel="noreferrer">Abrir enlace</a></p>` : ''}
        ${a.media_url ? `<div class="announcement-media">${mediaPreviewHtml(a.media_url)}</div>` : ''}
        <small>${formatDate(a.fecha_publicacion)}</small>
        <div class="actions-row">${adminDeleteButton('announcement', a.id)}</div>
      </article>
    `
      )
      .join('') || '<p>Sin avisos.</p>';
}

async function fetchReplies(topicId) {
  try {
    return await api(`/user/forum/topics/${topicId}/replies`, { method: 'GET' });
  } catch (_) {
    return [];
  }
}

function renderReply(r) {
  return `
    <p><strong>${escapeHtml(r.autor || 'usuario')}:</strong> ${escapeHtml(r.contenido || '')}</p>
    <small>${formatDate(r.fecha_respuesta)}</small>
    <div class="actions-row">
      ${ownerDeleteButton('reply', r.id, r.user_id)}
      ${adminDeleteButton('reply', r.id)}
    </div>
  `;
}

async function renderTopics(topics = []) {
  const wrap = $('#topics');
  if (!wrap) return;

  if (!topics.length) {
    wrap.innerHTML = '<p>Sin debates.</p>';
    return;
  }

  const html = await Promise.all(
    topics.map(async (t) => {
      const replies = await fetchReplies(t.id);
      return `
        <article class="topic-card" data-topic-id="${t.id}">
          <h4>${escapeHtml(t.titulo || '')}</h4>
          <p>${escapeHtml(t.contenido || '')}</p>
          <small>por ${escapeHtml(t.autor || '')} · ${formatDate(t.fecha_creacion)}</small>
          <div class="actions-row">
            ${ownerDeleteButton('topic', t.id, t.user_id)}
            ${adminDeleteButton('topic', t.id)}
          </div>
          <div class="replies-box">${replies.map(renderReply).join('') || '<p>Sin respuestas.</p>'}</div>
          ${
            currentUser
              ? `<form class="replyForm" data-topic-id="${t.id}">
                   <textarea name="contenido" placeholder="Responder..." required></textarea>
                   <button type="submit">Responder</button>
                 </form>`
              : ''
          }
        </article>
      `;
    })
  );

  wrap.innerHTML = html.join('');
}

async function loadUserData() {
  try {
    const [calendar, routine, history, forum] = await Promise.all([
      api('/user/calendar', { method: 'GET' }),
      api('/user/routine', { method: 'GET' }),
      api('/user/history', { method: 'GET' }),
      api('/user/forum', { method: 'GET' })
    ]);

    if ($('#calendarList')) {
      $('#calendarList').innerHTML =
        calendar.map((e) => `<li>${escapeHtml(e.fecha)}: ${escapeHtml(e.titulo)}</li>`).join('') || '<li>Sin eventos</li>';
    }

    renderRows(
      $('#routineBody'),
      routine,
      (r) => `<tr><td>${escapeHtml(r.dia)}</td><td>${escapeHtml(r.ejercicio)}</td><td>${escapeHtml(r.series || '')}</td><td>${escapeHtml(r.repeticiones || '')}</td><td>${escapeHtml(r.observaciones || '')}</td></tr>`,
      5
    );

    renderRows(
      $('#historyBody'),
      history,
      (h) => `<tr><td>${escapeHtml(h.fecha)}</td><td>${escapeHtml(h.actividad)}</td><td>${escapeHtml(h.observaciones || '')}</td><td>${escapeHtml(h.evolucion || '')}</td></tr>`,
      4
    );

    renderAnnouncements(forum.announcements || []);
    await renderTopics(forum.topics || []);
  } catch (_) {
    // sin sesión
  }
}

async function refreshSession() {
  const authMessage = $('#authMessage');
  const sessionActions = $('#sessionActions');
  const logoutBtn = ensureLogoutButton();

  try {
    currentUser = await api('/user/me', { method: 'GET' });
    if (authMessage) authMessage.textContent = `Sesión activa: ${currentUser.nombre} (${currentUser.rol})`;
    if (sessionActions) sessionActions.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'block';
  } catch (_) {
    currentUser = null;
    if (authMessage) authMessage.textContent = '';
    if (sessionActions) sessionActions.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

function setupAnnouncementPreview() {
  const form = $('#adminAnnouncementForm');
  const mediaInput = form ? form.querySelector('[name="media_url"]') : null;
  const preview = $('#mediaPreview');
  if (!form || !mediaInput || !preview) return;

  const render = () => {
    preview.innerHTML = mediaPreviewHtml(mediaInput.value || '');
  };

  mediaInput.addEventListener('input', render);

  const fileInput = form.querySelector('#media_file');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.type.startsWith('image/')) {
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="preview local" />`;
      } else if (file.type.startsWith('video/')) {
        preview.innerHTML = `<video controls src="${URL.createObjectURL(file)}"></video>`;
      }
    });
  }

  render();
}

function setupAuthForms() {
  if ($('#registerForm')) {
    $('#registerForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      try {
        await api('/auth/register', { method: 'POST', body: JSON.stringify(data) });
        if ($('#authMessage')) $('#authMessage').textContent = 'Registro exitoso. Ahora iniciá sesión.';
        event.target.reset();
      } catch (error) {
        if ($('#authMessage')) $('#authMessage').textContent = error.message;
      }
    });
  }

  if ($('#loginForm')) {
    $('#loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      try {
        await api('/auth/login', { method: 'POST', body: JSON.stringify(data) });
        await refreshAll();
      } catch (error) {
        if ($('#authMessage')) $('#authMessage').textContent = error.message;
      }
    });
  }

  const logoutBtn = ensureLogoutButton();
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await api('/auth/logout', { method: 'POST' });
      } catch (_) {}
      await refreshAll();
    });
  }
}

function setupTopicForm() {
  const topicForm = $('#topicForm');
  if (!topicForm) return;

  topicForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(topicForm).entries());
      await api('/user/forum/topics', { method: 'POST', body: JSON.stringify(data) });
      topicForm.reset();
      await loadUserData();
    } catch (error) {
      alert(error.message);
    }
  });
}

function setupAnnouncementForm() {
  const form = $('#adminAnnouncementForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const titulo = form.querySelector('[name="titulo"]')?.value || '';
      const subtitulo = form.querySelector('[name="subtitulo"]')?.value || '';
      const contenido = form.querySelector('[name="contenido"]')?.value || '';
      const link = form.querySelector('[name="link"]')?.value || '';
      const media_url = form.querySelector('[name="media_url"]')?.value || '';

      await api('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ titulo, subtitulo, contenido, link, media_url })
      });

      form.reset();
      setupAnnouncementPreview();
      await loadUserData();
    } catch (error) {
      alert(error.message);
    }
  });
}

function setupForumDelegation() {
  document.addEventListener('submit', async (event) => {
    const replyForm = event.target.closest('.replyForm');
    if (!replyForm) return;

    event.preventDefault();
    const topicId = replyForm.getAttribute('data-topic-id');
    const contenido = (replyForm.querySelector('textarea[name="contenido"]')?.value || '').trim();
    if (!contenido) return;

    try {
      await api(`/user/forum/topics/${topicId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ contenido })
      });
      replyForm.reset();
      await loadUserData();
    } catch (error) {
      alert(error.message);
    }
  });

  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const type = btn.getAttribute('data-type');
    const id = btn.getAttribute('data-id');

    try {
      if (action === 'owner-delete') {
        if (type === 'topic') await api(`/user/forum/topics/${id}`, { method: 'DELETE' });
        if (type === 'reply') await api(`/user/forum/replies/${id}`, { method: 'DELETE' });
      }

      if (action === 'admin-delete') {
        if (type === 'announcement') await api(`/admin/announcements/${id}`, { method: 'DELETE' });
        if (type === 'topic') await api(`/admin/forum/topics/${id}`, { method: 'DELETE' });
        if (type === 'reply') await api(`/admin/forum/replies/${id}`, { method: 'DELETE' });
      }

      await loadUserData();
    } catch (error) {
      alert(error.message);
    }
  });
}

async function refreshAll() {
  await refreshSession();
  await loadUserData();
  if ($('#adminTools')) $('#adminTools').style.display = canModerate() ? 'block' : 'none';
}

(async function init() {
  await getCsrf();
  setupMenu();
  setupAuthForms();
  setupTopicForm();
  setupAnnouncementForm();
  setupForumDelegation();
  setupAnnouncementPreview();
  await loadPublicData();
  await refreshAll();
})();