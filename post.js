document.getElementById('masthead-date').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

const params = new URLSearchParams(window.location.search);
const postId = params.get('post');

if (!postId) {
  window.location.href = 'index.html';
} else {
  fetch('posts.json')
    .then(r => r.json())
    .then(posts => {
      const post = posts.find(p => p.id === postId);
      if (!post) {
        renderError('Post not found.');
        return;
      }
      document.title = post.title + ' — Famous Jewish People';
      return fetch(post.file)
        .then(r => {
          if (!r.ok) throw new Error('File not found');
          return r.text();
        })
        .then(md => renderPost(post, md));
    })
    .catch(() => renderError('Could not load this post.'));
}

function renderPost(meta, md) {
  const isAdmin = !!localStorage.getItem('fjp_config');
  document.getElementById('article-content').innerHTML = `
    <nav class="breadcrumb">
      <a href="index.html">&larr; Back to Home</a>
      &nbsp;&mdash;&nbsp;
      <a href="index.html?category=${encodeURIComponent(meta.category)}">${meta.category}</a>
    </nav>
    <article class="article">
      <div class="article-kicker">${meta.category}</div>
      <h1 class="article-title">${meta.title}</h1>
      <div class="article-meta">${formatDate(meta.date)}</div>
      <hr class="article-divider">
      <div class="article-body">
        ${marked.parse(md)}
      </div>
      ${isAdmin ? `<a href="admin.html?edit=${meta.id}" class="admin-edit-link">✏ Edit this post</a>` : ''}
    </article>
  `;
}

function renderError(msg) {
  document.getElementById('article-content').innerHTML = `
    <nav class="breadcrumb"><a href="index.html">&larr; Back to Home</a></nav>
    <p style="text-align:center; padding: 3rem; color: #666; font-style: italic;">${msg}</p>
  `;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}
