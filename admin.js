const CATEGORIES = ['Athletes', 'Entertainment', 'Music', 'Business', 'Content Creators', 'Science & History'];

let config = null;
let posts = [];
let mde = null;

// ── Boot ──────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('masthead-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const saved = localStorage.getItem('fjp_config');
  const editParam = new URLSearchParams(window.location.search).get('edit');

  if (saved) {
    config = JSON.parse(saved);
    if (editParam) {
      // load posts then open editor directly
      getFile('posts.json').then(d => {
        posts = JSON.parse(d.content);
        editPost(editParam);
      }).catch(() => showDashboard());
    } else {
      showDashboard();
    }
  } else {
    show('login-panel');
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.hidden = true;
  btn.textContent = 'Connecting…';
  btn.disabled = true;

  const token = e.target.token.value.trim();
  const owner = e.target.owner.value.trim();
  const repo = e.target.repo.value.trim();
  const branch = e.target.branch.value.trim() || 'main';

  try {
    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: ghHeaders(token)
    });
    if (!resp.ok) throw new Error('Cannot reach repo. Check token and repo name.');

    config = { token, owner, repo, branch };
    localStorage.setItem('fjp_config', JSON.stringify(config));
    showDashboard();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
    btn.textContent = 'Connect';
    btn.disabled = false;
  }
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function showDashboard() {
  show('dashboard');
  document.getElementById('logout-btn').hidden = false;
  document.getElementById('posts-list').innerHTML = '<p class="admin-empty">Loading…</p>';

  try {
    const data = await getFile('posts.json');
    posts = JSON.parse(data.content);
  } catch {
    posts = [];
  }

  renderPostList();
}

function renderPostList() {
  const el = document.getElementById('posts-list');
  if (posts.length === 0) {
    el.innerHTML = '<p class="admin-empty">No posts yet. Click <strong>+ New Post</strong> to get started.</p>';
    return;
  }

  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  el.innerHTML = sorted.map(post => `
    <div class="admin-post-row">
      <div class="admin-post-info">
        <span class="category-tag">${post.category}</span>
        <span class="admin-post-title">${post.title}</span>
        ${post.featured ? '<span class="featured-badge">Featured</span>' : ''}
        <span class="admin-post-date">${formatDate(post.date)}</span>
      </div>
      <div class="admin-actions">
        <button class="btn-edit" onclick="editPost('${post.id}')">Edit</button>
        <button class="btn-delete" onclick="deletePost('${post.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// ── Editor ────────────────────────────────────────────────────────────────────

async function newPost() {
  openEditor({ id: '', title: '', category: 'Entertainment', date: todayStr(), excerpt: '', body: '', featured: false });
}

async function editPost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  setStatus('Loading…');
  show('editor-panel');

  try {
    const data = await getFile(post.file);
    openEditor({ ...post, body: data.content });
  } catch {
    openEditor({ ...post, body: '' });
  }
}

function openEditor(data) {
  show('editor-panel');
  setStatus('');

  document.getElementById('edit-title').value = data.title;
  document.getElementById('edit-category').value = data.category || 'Entertainment';
  document.getElementById('edit-date').value = data.date;
  document.getElementById('edit-excerpt').value = data.excerpt;
  document.getElementById('edit-featured').checked = !!data.featured;

  // Store original id for updates
  document.getElementById('editor-form').dataset.editingId = data.id;

  // Destroy previous EasyMDE instance
  if (mde) { mde.toTextArea(); mde = null; }

  document.getElementById('edit-content').value = data.body || '';

  mde = new EasyMDE({
    element: document.getElementById('edit-content'),
    spellChecker: false,
    autosave: { enabled: false },
    toolbar: ['bold', 'italic', 'heading-2', 'heading-3', '|',
              'quote', 'unordered-list', 'ordered-list', '|',
              'preview', 'side-by-side', 'fullscreen'],
    minHeight: '420px',
    placeholder: 'Write the full article in Markdown…',
  });
}

document.getElementById('editor-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('save-btn');
  btn.textContent = 'Saving…';
  btn.disabled = true;
  setStatus('');

  const originalId = e.target.dataset.editingId;
  const title = document.getElementById('edit-title').value.trim();
  const category = document.getElementById('edit-category').value;
  const date = document.getElementById('edit-date').value;
  const excerpt = document.getElementById('edit-excerpt').value.trim();
  const featured = document.getElementById('edit-featured').checked;
  const body = mde.value();

  const id = originalId || slugify(title);
  const file = `posts/${id}.md`;

  // If this post is now featured, unset all others
  if (featured) posts.forEach(p => { p.featured = false; });

  const meta = { id, title, category, date, excerpt, file, featured };
  const idx = posts.findIndex(p => p.id === id);
  if (idx >= 0) posts[idx] = meta; else posts.push(meta);

  try {
    await saveFile(file, body, `${originalId ? 'Update' : 'Add'} post: ${title}`);
    await saveFile('posts.json', JSON.stringify(posts, null, 2), `Update posts index`);
    setStatus('Saved! Vercel is deploying…');
    setTimeout(showDashboard, 1200);
  } catch (err) {
    setStatus('Error: ' + err.message);
    btn.textContent = 'Save & Publish';
    btn.disabled = false;
  }
});

async function deletePost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

  posts = posts.filter(p => p.id !== id);

  try {
    await deleteFile(post.file, `Delete post: ${post.title}`);
    await saveFile('posts.json', JSON.stringify(posts, null, 2), `Remove post: ${post.title}`);
    renderPostList();
  } catch (err) {
    alert('Error deleting: ' + err.message);
    posts.push(post);
  }
}

// ── GitHub API ────────────────────────────────────────────────────────────────

async function getFile(path) {
  const { token, owner, repo, branch } = config;
  const resp = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: ghHeaders(token) }
  );
  if (!resp.ok) throw new Error(`Cannot read ${path}`);
  const json = await resp.json();
  return {
    content: decodeURIComponent(escape(atob(json.content.replace(/\n/g, '')))),
    sha: json.sha
  };
}

async function saveFile(path, content, message) {
  const { token, owner, repo, branch } = config;

  let sha;
  try { sha = (await getFile(path)).sha; } catch {}

  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
    ...(sha ? { sha } : {})
  };

  const resp = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `GitHub error on ${path}`);
  }
}

async function deleteFile(path, message) {
  const { token, owner, repo, branch } = config;
  const { sha } = await getFile(path);

  const resp = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'DELETE',
      headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sha, branch })
    }
  );

  if (!resp.ok) throw new Error(`Could not delete ${path}`);
}

function ghHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function show(panelId) {
  ['login-panel', 'dashboard', 'editor-panel'].forEach(id => {
    document.getElementById(id).hidden = id !== panelId;
  });
}

function setStatus(msg) {
  document.getElementById('editor-status').textContent = msg;
}

function logout() {
  if (!confirm('Log out? You will need to re-enter your GitHub token.')) return;
  localStorage.removeItem('fjp_config');
  config = null;
  document.getElementById('logout-btn').hidden = true;
  show('login-panel');
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}
