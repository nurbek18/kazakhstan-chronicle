let cachedNews = null;

document.addEventListener('DOMContentLoaded', () => {
  initFontToggle();
  initNavHighlight();
  initArticlePage();
  initHomeNews();
  initRefreshButton();
});

function initFontToggle() {
  const btn = document.getElementById('font-toggle');
  if (!btn) return;
  const sizes = ['', 'font-large', 'font-xlarge'];
  let current = 0;
  btn.addEventListener('click', () => {
    document.body.classList.remove(sizes[current]);
    current = (current + 1) % sizes.length;
    if (sizes[current]) document.body.classList.add(sizes[current]);
  });
}

function initNavHighlight() {
  const links = document.querySelectorAll('.section-nav a');
  if (!links.length) return;
  const sections = Array.from(links).map(link => ({
    link,
    el: document.getElementById(link.getAttribute('href').slice(1)),
  })).filter(s => s.el);
  if (!sections.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const match = sections.find(s => s.el === entry.target);
        if (match) match.link.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s.el));
}

function initArticlePage() {
  const container = document.getElementById('article-content');
  if (!container) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;

  loadNewsData()
    .then(data => {
      cachedNews = data;
      const article = data.articles.find(a => a.id === id);
      if (!article) {
        container.innerHTML = `<p class="error">${escapeHtml(t('articleNotFound'))}</p>`;
        return;
      }
      renderArticlePage(container, article);
    })
    .catch(() => {
      container.innerHTML = `<p class="error">${escapeHtml(t('loadError'))}</p>`;
    });
}

function initHomeNews() {
  const main = document.getElementById('front-page');
  if (!main) return;

  loadNewsData()
    .then(async data => {
      cachedNews = data;
      await prepareChineseContent(data);
      renderHomePage(data);
      const updated = document.getElementById('news-updated');
      if (updated && data.updated_at) {
        updated.textContent = t('newsUpdated', formatDateTime(data.updated_at));
      }
    })
    .catch(err => {
      main.innerHTML = `
        <div class="news-error">
          <h2>${escapeHtml(t('loadError'))}</h2>
          <p>${t('loadErrorHint')}</p>
          <p class="error-detail">${escapeHtml(err.message)}</p>
        </div>`;
    });
}

async function translateHeadline(article) {
  const loc = getLocalizedArticle(article);
  if (!loc.needsTranslation) return loc;
  const from = article.lang || 'ru';
  const title = await translateText(article.title, from, 'zh');
  const summary = await translateText(article.summary, from, 'zh');
  return setLocalizedDisplay(article, {
    title,
    summary,
    body: loc.body,
    section_label: sectionLabel(article.section),
    isTranslated: true,
    needsTranslation: false,
  });
}

async function prepareChineseContent(data) {
  const loading = document.getElementById('loading-state');
  if (loading) {
    loading.style.display = 'block';
    loading.querySelector('p').textContent = t('translating');
  }

  const picks = [
    data.lead,
    ...(data.by_section?.politics || []).slice(0, 1),
    ...(data.by_section?.economy || []).slice(0, 1),
    ...(data.by_section?.culture || []).slice(0, 1),
    ...(data.by_section?.sports || []).slice(0, 5),
    ...(data.by_section?.society || []).slice(0, 4),
    ...data.articles.slice(0, 24),
  ].filter(Boolean);

  const unique = [...new Map(picks.map(a => [a.id, a])).values()];

  for (const article of unique) {
    try {
      await translateHeadline(article);
    } catch { /* skip */ }
  }

  if (data.lead) {
    const loc = getLocalizedArticle(data.lead);
    const from = data.lead.lang || 'ru';
    if (!loc.body?.length || !hasChinese(loc.body[0])) {
      const body = await translateParagraphs((data.lead.body || []).slice(0, 3), from);
      data.lead._zhDisplay = { ...data.lead._zhDisplay, body };
    }
  }
}

async function loadNewsData() {
  const sources = ['data/news.json', '/api/news'];
  let lastError = null;
  for (const url of sources) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return res.json();
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(t('loadError'));
}

function isStaticHosting() {
  return !window.location.hostname.includes('localhost')
    && !window.location.hostname.includes('127.0.0.1');
}

function renderHomePage(data) {
  const loading = document.getElementById('loading-state');
  if (loading) loading.style.display = 'none';
  const edition = document.getElementById('edition-num');
  if (edition) edition.textContent = t('articlesCount', data.total);
  renderLeadStory(data.lead);
  renderStoryGrid(data.by_section || {});
  renderInnerColumns(data.by_section || {}, data.weather);
  renderMoreNews(data.articles.slice(0, 24));
}

function renderLeadStory(article) {
  const block = document.getElementById('lead-story');
  if (!block || !article) return;
  const loc = getLocalizedArticle(article);
  const imageHtml = article.image
    ? `<img src="${escapeAttr(article.image)}" alt="" loading="eager" referrerpolicy="no-referrer">` : '';

  block.innerHTML = `
    <div class="lead-headline-block">
      <span class="kicker">${escapeHtml(loc.section_label)}</span>
      <h2 class="headline-xl">${escapeHtml(loc.title)}</h2>
      <p class="deck">${escapeHtml(loc.summary)}</p>
      <p class="byline">${escapeHtml(sourceName(article.source))} &nbsp;|&nbsp; ${formatDateTime(article.published)}</p>
    </div>
    <div class="lead-body columns-3">
      ${article.image ? `
      <figure class="lead-image">
        <div class="image-frame">${imageHtml}</div>
        <figcaption>${escapeHtml(sourceName(article.source))} · ${escapeHtml(loc.section_label)}</figcaption>
      </figure>` : ''}
      ${(loc.body?.length && hasChinese(loc.body[0]) ? loc.body : [loc.summary]).slice(0, 3).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
      <p class="continued"><a href="article.html?id=${escapeAttr(article.id)}">${escapeHtml(t('readFull'))}</a></p>
      <p class="source-link"><a href="${escapeAttr(article.link)}" target="_blank" rel="noopener">${escapeHtml(t('readOriginal', sourceName(article.source)))}</a></p>
    </div>`;
}

function renderStoryGrid(bySection) {
  const grid = document.getElementById('story-grid');
  if (!grid) return;
  const picks = [
    (bySection.politics || [])[0],
    (bySection.economy || [])[0],
    (bySection.culture || [])[0] || (bySection.society || [])[0],
  ].filter(Boolean);

  grid.innerHTML = picks.map((article, i) => {
    const loc = getLocalizedArticle(article);
    const sectionIds = ['politics', 'economy', 'culture'];
    const idAttr = sectionIds[i] ? ` id="${sectionIds[i]}"` : '';
    return `
      <article class="story-card"${idAttr}>
        ${article.image ? `<div class="card-image"><img src="${escapeAttr(article.image)}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>` : ''}
        <span class="section-label">${escapeHtml(loc.section_label)}</span>
        <h3 class="headline-md">${escapeHtml(loc.title)}</h3>
        <p class="story-excerpt">${escapeHtml(loc.summary)}</p>
        <p class="card-meta">${escapeHtml(sourceName(article.source))} · ${formatDateTime(article.published)}</p>
        <a href="article.html?id=${escapeAttr(article.id)}" class="read-more">${escapeHtml(t('readFull'))}</a>
      </article>`;
  }).join('');
}

function renderInnerColumns(bySection, weather) {
  const sportsCol = document.getElementById('sports-column');
  const societyCol = document.getElementById('society-column');
  const weatherCol = document.getElementById('weather-column');

  if (sportsCol) {
    const sports = (bySection.sports || []).slice(0, 5);
    sportsCol.innerHTML = sports.length
      ? sports.map(a => {
          const loc = getLocalizedArticle(a);
          return `<p><strong>${escapeHtml(loc.section_label)}</strong> — <a href="article.html?id=${escapeAttr(a.id)}">${escapeHtml(truncate(loc.title, 80))}</a></p>`;
        }).join('')
      : `<p>${escapeHtml(t('noSports'))}</p>`;
  }

  if (societyCol) {
    const society = (bySection.society || []).slice(0, 4);
    societyCol.innerHTML = society.length
      ? society.map(a => {
          const loc = getLocalizedArticle(a);
          return `<p><a href="article.html?id=${escapeAttr(a.id)}">${escapeHtml(truncate(loc.title, 100))}</a> <span class="inline-meta">(${escapeHtml(sourceName(a.source))})</span></p>`;
        }).join('')
      : `<p>${escapeHtml(t('noSociety'))}</p>`;
  }

  if (weatherCol && weather) weatherCol.innerHTML = renderWeather(weather);
}

function renderMoreNews(articles) {
  const list = document.getElementById('more-news-list');
  if (!list) return;
  list.innerHTML = articles.map(a => {
    const loc = getLocalizedArticle(a);
    return `
    <article class="more-news-item">
      ${a.image ? `<a class="more-thumb" href="article.html?id=${escapeAttr(a.id)}"><img src="${escapeAttr(a.image)}" alt="" loading="lazy" referrerpolicy="no-referrer"></a>` : ''}
      <div class="more-body">
        <span class="section-label">${escapeHtml(loc.section_label)}</span>
        <h4><a href="article.html?id=${escapeAttr(a.id)}">${escapeHtml(loc.title)}</a></h4>
        <p>${escapeHtml(truncate(loc.summary, 140))}</p>
        <span class="inline-meta">${escapeHtml(sourceName(a.source))} · ${formatDateTime(a.published)}</span>
      </div>
    </article>`;
  }).join('');
}

async function renderArticlePage(container, article) {
  let loc = getLocalizedArticle(article);

  if (loc.needsTranslation) {
    container.innerHTML = `<p class="loading-state">${escapeHtml(t('translating'))}</p>`;
    try {
      loc = await translateArticleFields(article);
    } catch {
      loc = getLocalizedArticle(article);
    }
  }

  document.title = `${loc.title} | ${t('siteTitle')}`;
  const imageBlock = article.image
    ? `<figure class="article-figure"><img src="${escapeAttr(article.image)}" alt="" referrerpolicy="no-referrer"><figcaption>${escapeHtml(sourceName(article.source))}</figcaption></figure>`
    : '';

  container.innerHTML = `
    <a href="index.html" class="back-link">${escapeHtml(t('backHome'))}</a>
    <header class="article-header">
      <span class="section-label">${escapeHtml(loc.section_label)}</span>
      <h2 class="headline-xl">${escapeHtml(loc.title)}</h2>
      <p class="deck">${escapeHtml(loc.summary)}</p>
      <p class="byline">${escapeHtml(sourceName(article.source))} &nbsp;|&nbsp; ${formatDateTime(article.published)}</p>
      ${loc.isTranslated ? `<p class="translation-note">${escapeHtml(t('translationNote'))}</p>` : ''}
    </header>
    ${imageBlock}
    <div class="article-body">${loc.body.map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div>
    <p class="source-link article-source"><a href="${escapeAttr(article.link)}" target="_blank" rel="noopener">${escapeHtml(t('readOriginal', sourceName(article.source)))}</a></p>`;
}

function renderWeather(weather) {
  const codes = t('weather.codes');
  const cityNames = t('cities');
  const blocks = Object.entries(weather).map(([key, city]) => {
    const name = cityNames[key] || city.name;
    if (city.temp == null) return `<p><strong>${escapeHtml(name)}</strong> — ${escapeHtml(t('weather.unavailable'))}</p>`;
    const label = codes[city.weather_code] || codes[2];
    return `<p><strong>${escapeHtml(name)}</strong> — ${escapeHtml(label)}, ${city.temp}°C (${city.low}° — ${city.high}°). ${escapeHtml(t('weather.wind', city.wind ?? '—'))}.</p>`;
  });
  const first = Object.values(weather)[0];
  if (first?.tomorrow_high != null) {
    blocks.push(`<p>${escapeHtml(t('weather.tomorrow', first.tomorrow_low, first.tomorrow_high))}</p>`);
  }
  return blocks.join('');
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

function initRefreshButton() {
  const btn = document.getElementById('refresh-toggle');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = '…';
    try {
      if (!isStaticHosting()) {
        const res = await fetch('/api/refresh');
        const result = await res.json();
        if (!result.ok) throw new Error(result.error || t('refreshFail'));
      }
      cachedNews = await loadNewsData();
      if (document.getElementById('front-page')) renderHomePage(cachedNews);
      const updated = document.getElementById('news-updated');
      if (updated) updated.textContent = t('newsUpdated', formatDateTime(cachedNews.updated_at));
    } catch (err) {
      alert(`${t('refreshFail')}: ${isStaticHosting() ? t('refreshStatic') : err.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = '↻';
    }
  });
}
