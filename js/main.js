document.addEventListener('DOMContentLoaded', () => {
  setDateLine();
  initFontToggle();
  initNavHighlight();
  initArticlePage();
  initHomeNews();
  initRefreshButton();
});

function setDateLine() {
  const el = document.getElementById('date-line');
  if (!el) return;

  const now = new Date();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const formatted = `哈萨克斯坦 ${now.getFullYear()}年${months[now.getMonth()]}${now.getDate()}日 ${weekdays[now.getDay()]}`;
  el.textContent = formatted;
}

function initFontToggle() {
  const btn = document.getElementById('font-toggle');
  if (!btn) return;

  const sizes = ['', 'font-large', 'font-xlarge'];
  let current = 0;

  btn.addEventListener('click', () => {
    document.body.classList.remove(sizes[current]);
    current = (current + 1) % sizes.length;
    if (sizes[current]) {
      document.body.classList.add(sizes[current]);
    }
  });
}

function initNavHighlight() {
  const links = document.querySelectorAll('.section-nav a');
  if (!links.length) return;

  const sections = Array.from(links).map(link => {
    const id = link.getAttribute('href').slice(1);
    return { link, el: document.getElementById(id) };
  }).filter(s => s.el);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const match = sections.find(s => s.el === entry.target);
          if (match) match.link.classList.add('active');
        }
      });
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
  );

  sections.forEach(s => observer.observe(s.el));
}

function initArticlePage() {
  const container = document.getElementById('article-content');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  loadNewsData()
    .then(data => {
      const article = data.articles.find(a => a.id === id);
      if (!article) {
        container.innerHTML = '<p class="error">未找到该文章。</p>';
        document.title = '文章未找到 | 哈萨克纪闻';
        return;
      }
      renderArticlePage(container, article);
    })
    .catch(() => {
      container.innerHTML = '<p class="error">无法加载新闻数据，请确认已启动 server.py。</p>';
    });
}

function initHomeNews() {
  const main = document.getElementById('front-page');
  if (!main) return;

  loadNewsData()
    .then(data => {
      renderHomePage(data);
      const updated = document.getElementById('news-updated');
      if (updated && data.updated_at) {
        updated.textContent = `新闻更新：${formatDateTime(data.updated_at)}`;
      }
    })
    .catch(err => {
      main.innerHTML = `
        <div class="news-error">
          <h2>无法加载哈萨克斯坦新闻</h2>
          <p>请使用 <code>py server.py</code> 启动网站（会自动抓取新闻），不要直接双击打开 HTML 文件。</p>
          <p class="error-detail">${escapeHtml(err.message)}</p>
        </div>`;
    });
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

  throw lastError || new Error('无法加载新闻');
}

function isStaticHosting() {
  return !window.location.hostname.includes('localhost')
    && !window.location.hostname.includes('127.0.0.1');
}

function renderHomePage(data) {
  const lead = data.lead;
  const bySection = data.by_section || {};

  const loading = document.getElementById('loading-state');
  if (loading) loading.style.display = 'none';

  const edition = document.getElementById('edition-num');
  if (edition) edition.textContent = `共 ${data.total} 篇`;

  renderLeadStory(lead);
  renderStoryGrid(bySection);
  renderInnerColumns(bySection, data.weather);
  renderMoreNews(data.articles.slice(0, 24));
}

function renderLeadStory(article) {
  const block = document.getElementById('lead-story');
  if (!block || !article) return;

  const imageHtml = article.image
    ? `<img src="${escapeAttr(article.image)}" alt="" loading="eager" referrerpolicy="no-referrer">`
    : '';

  block.innerHTML = `
    <div class="lead-headline-block">
      <span class="kicker">${escapeHtml(article.section_label)}</span>
      <h2 class="headline-xl">${escapeHtml(article.title)}</h2>
      <p class="deck">${escapeHtml(article.summary)}</p>
      <p class="byline">${escapeHtml(article.source)} &nbsp;|&nbsp; ${formatDateTime(article.published)}</p>
    </div>
    <div class="lead-body columns-3">
      ${article.image ? `
      <figure class="lead-image">
        <div class="image-frame">${imageHtml}</div>
        <figcaption>${escapeHtml(article.source)} · ${escapeHtml(article.section_label)}</figcaption>
      </figure>` : ''}
      ${article.body.slice(0, 3).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
      <p class="continued"><a href="article.html?id=${escapeAttr(article.id)}">阅读全文 →</a></p>
      <p class="source-link"><a href="${escapeAttr(article.link)}" target="_blank" rel="noopener">阅读原文（${article.lang === 'en' ? 'English' : 'Русский'}）</a></p>
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
    const sectionIds = ['politics', 'economy', 'culture'];
    const idAttr = sectionIds[i] ? ` id="${sectionIds[i]}"` : '';
    return `
      <article class="story-card"${idAttr}>
        ${article.image ? `<div class="card-image"><img src="${escapeAttr(article.image)}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>` : ''}
        <span class="section-label">${escapeHtml(article.section_label)}</span>
        <h3 class="headline-md">${escapeHtml(article.title)}</h3>
        <p class="story-excerpt">${escapeHtml(article.summary)}</p>
        <p class="card-meta">${escapeHtml(article.source)} · ${formatDateTime(article.published)}</p>
        <a href="article.html?id=${escapeAttr(article.id)}" class="read-more">阅读全文</a>
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
      ? sports.map(a => `<p><strong>${escapeHtml(a.section_label)}</strong> — <a href="article.html?id=${escapeAttr(a.id)}">${escapeHtml(truncate(a.title, 80))}</a></p>`).join('')
      : '<p>暂无体育新闻</p>';
  }

  if (societyCol) {
    const society = (bySection.society || []).slice(0, 4);
    societyCol.innerHTML = society.length
      ? society.map(a => `<p><a href="article.html?id=${escapeAttr(a.id)}">${escapeHtml(truncate(a.title, 100))}</a> <span class="inline-meta">(${escapeHtml(a.source)})</span></p>`).join('')
      : '<p>暂无社会新闻</p>';
  }

  if (weatherCol && weather) {
    weatherCol.innerHTML = renderWeather(weather);
  }
}

function renderMoreNews(articles) {
  const list = document.getElementById('more-news-list');
  if (!list) return;

  const skip = new Set();
  document.querySelectorAll('[data-skip-id]').forEach(el => skip.add(el.dataset.skipId));

  const items = articles.filter(a => !skip.has(a.id));
  list.innerHTML = items.map(a => `
    <article class="more-news-item">
      ${a.image ? `<a class="more-thumb" href="article.html?id=${escapeAttr(a.id)}"><img src="${escapeAttr(a.image)}" alt="" loading="lazy" referrerpolicy="no-referrer"></a>` : ''}
      <div class="more-body">
        <span class="section-label">${escapeHtml(a.section_label)}</span>
        <h4><a href="article.html?id=${escapeAttr(a.id)}">${escapeHtml(a.title)}</a></h4>
        <p>${escapeHtml(truncate(a.summary, 140))}</p>
        <span class="inline-meta">${escapeHtml(a.source)} · ${formatDateTime(a.published)}</span>
      </div>
    </article>`).join('');
}

function renderArticlePage(container, article) {
  document.title = `${article.title} | 哈萨克纪闻`;

  const imageBlock = article.image
    ? `<figure class="article-figure"><img src="${escapeAttr(article.image)}" alt="" referrerpolicy="no-referrer"><figcaption>${escapeHtml(article.source)}</figcaption></figure>`
    : '';

  container.innerHTML = `
    <a href="index.html" class="back-link">← 返回头版</a>
    <header class="article-header">
      <span class="section-label">${escapeHtml(article.section_label)}</span>
      <h2 class="headline-xl">${escapeHtml(article.title)}</h2>
      <p class="deck">${escapeHtml(article.summary)}</p>
      <p class="byline">${escapeHtml(article.source)} &nbsp;|&nbsp; ${formatDateTime(article.published)}</p>
    </header>
    ${imageBlock}
    <div class="article-body">${article.body.map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div>
    <p class="source-link article-source"><a href="${escapeAttr(article.link)}" target="_blank" rel="noopener">在 ${escapeHtml(article.source)} 阅读原文 →</a></p>`;
}

function renderWeather(weather) {
  const codes = {
    0: '晴', 1: '大部晴朗', 2: '多云', 3: '阴',
    45: '雾', 48: '雾凇', 51: '小雨', 61: '雨', 71: '雪', 80: '阵雨',
  };

  const blocks = Object.values(weather).map(city => {
    if (city.temp == null) return `<p><strong>${escapeHtml(city.name)}</strong> — 天气数据暂不可用</p>`;
    const label = codes[city.weather_code] || '多云';
    return `<p><strong>${escapeHtml(city.name)}</strong> — ${label}，${city.temp}°C（${city.low}° ~ ${city.high}°）。风速 ${city.wind ?? '—'} km/h。</p>`;
  });

  const first = Object.values(weather)[1] || Object.values(weather)[0];
  if (first && first.tomorrow_high != null) {
    blocks.push(`<p>明日预报：气温 ${first.tomorrow_low}° — ${first.tomorrow_high}°C，出行请留意天气变化。</p>`);
  }

  return blocks.join('');
}

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
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
        if (!result.ok) throw new Error(result.error || '刷新失败');
      }
      const data = await loadNewsData();
      if (document.getElementById('front-page')) {
        renderHomePage(data);
      }
      const updated = document.getElementById('news-updated');
      if (updated) updated.textContent = `新闻更新：${formatDateTime(data.updated_at)}`;
    } catch (err) {
      const hint = isStaticHosting()
        ? '线上版每 6 小时自动更新新闻，请稍后再试。'
        : err.message;
      alert(`刷新失败：${hint}`);
    } finally {
      btn.disabled = false;
      btn.textContent = '↻';
    }
  });
}
