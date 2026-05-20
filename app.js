document.getElementById('masthead-date').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

const params = new URLSearchParams(window.location.search);
const filterCategory = params.get('category');

fetch('posts.json')
  .then(r => r.json())
  .then(posts => {
    const filtered = filterCategory
      ? posts.filter(p => p.category === filterCategory)
      : posts;

    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    const featured = sorted.find(p => p.featured) || sorted[0];
    const rest = sorted.filter(p => p !== featured);

    const sectionHeader = document.getElementById('section-header');
    if (filterCategory) {
      sectionHeader.textContent = filterCategory;
    } else if (rest.length > 0) {
      sectionHeader.textContent = 'More Stories';
    }

    if (featured) renderFeatured(featured);
    renderGrid(rest);
  })
  .catch(() => {
    document.getElementById('posts-grid').innerHTML =
      '<p class="no-posts">Could not load posts. Make sure you are running a local server.</p>';
  });

function renderFeatured(post) {
  document.getElementById('featured').innerHTML = `
    <div class="featured-post">
      <div class="featured-kicker">${post.category}</div>
      <h2 class="featured-title">
        <a href="post.html?post=${post.id}">${post.title}</a>
      </h2>
      <p class="featured-excerpt">${post.excerpt}</p>
      <div class="featured-meta">
        <span>${formatDate(post.date)}</span>
        <a href="post.html?post=${post.id}" class="read-more">Continue Reading &rarr;</a>
      </div>
    </div>
  `;
}

function renderGrid(posts) {
  const grid = document.getElementById('posts-grid');
  if (posts.length === 0) {
    grid.innerHTML = '<p class="no-posts">No more posts in this category yet. Check back soon.</p>';
    return;
  }
  grid.innerHTML = posts.map(post => `
    <article class="post-card">
      <div class="category-tag">${post.category}</div>
      <h3 class="card-title">
        <a href="post.html?post=${post.id}">${post.title}</a>
      </h3>
      <p class="card-excerpt">${post.excerpt}</p>
      <div class="card-meta">
        <span>${formatDate(post.date)}</span>
        <a href="post.html?post=${post.id}" class="read-more">Read &rarr;</a>
      </div>
    </article>
  `).join('');
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}
