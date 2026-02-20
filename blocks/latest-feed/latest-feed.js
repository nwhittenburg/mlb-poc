const INDEX_PATH = '/articles-index.json';
const PAGE_SIZE = 3;

function parseDate(str) {
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

async function fetchArticles() {
  const resp = await fetch(INDEX_PATH);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.data || json)
    .filter((item) => item.title)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));
}

function createEntry(item) {
  const entry = document.createElement('a');
  entry.classList.add('latest-feed-entry');
  entry.href = item.path;

  const date = document.createElement('span');
  date.classList.add('latest-feed-date');
  date.textContent = item.date;
  entry.appendChild(date);

  const title = document.createElement('h3');
  title.classList.add('latest-feed-title');
  title.textContent = item.title;
  entry.appendChild(title);

  return entry;
}

function renderEntries(list, articles, loadMoreEl, visibleCount) {
  list.textContent = '';
  const fragment = document.createDocumentFragment();
  articles.slice(0, visibleCount).forEach((item) => fragment.appendChild(createEntry(item)));
  list.appendChild(fragment);
  loadMoreEl.hidden = visibleCount >= articles.length;
}

function buildLoadMore() {
  const wrapper = document.createElement('div');
  wrapper.classList.add('latest-feed-load-more');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.innerHTML = 'See more updates <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  wrapper.appendChild(btn);
  return wrapper;
}

export default async function decorate(block) {
  block.textContent = '';

  const articles = await fetchArticles();
  const list = document.createElement('div');
  list.classList.add('latest-feed-list');
  const loadMore = buildLoadMore();

  block.appendChild(list);
  block.appendChild(loadMore);

  let visibleCount = PAGE_SIZE;
  renderEntries(list, articles, loadMore, visibleCount);

  loadMore.querySelector('button').addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    renderEntries(list, articles, loadMore, visibleCount);
  });
}
