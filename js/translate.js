const MYMEMORY_LANG = { ru: 'ru', kk: 'kk', zh: 'zh-CN', en: 'en' };
const translateCache = new Map();

function cacheKey(text, from, to) {
  return `${from}|${to}|${text.slice(0, 80)}`;
}

async function translateText(text, from, to = 'zh') {
  if (!text?.trim() || from === to) return text;

  const key = cacheKey(text, from, to);
  if (translateCache.has(key)) return translateCache.get(key);

  const stored = sessionStorage.getItem(`tr:${key}`);
  if (stored) {
    translateCache.set(key, stored);
    return stored;
  }

  const src = MYMEMORY_LANG[from] || from;
  const dest = MYMEMORY_LANG[to] || to;
  const chunk = text.slice(0, 480);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${src}|${dest}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('翻译服务暂时不可用');
  const data = await res.json();
  const translated = data.responseData?.translatedText || text;

  translateCache.set(key, translated);
  try { sessionStorage.setItem(`tr:${key}`, translated); } catch { /* quota */ }
  return translated;
}

async function translateParagraphs(paragraphs, from) {
  const out = [];
  for (const p of paragraphs) {
    out.push(await translateText(p, from, 'zh'));
    await sleep(350);
  }
  return out;
}

async function translateArticleFields(article) {
  const from = article.lang || 'ru';
  const loc = getLocalizedArticle(article);
  if (!loc.needsTranslation && (loc.isTranslated || from === 'zh')) return loc;

  const [title, summary] = await Promise.all([
    translateText(article.title, from, 'zh'),
    translateText(article.summary, from, 'zh'),
  ]);
  await sleep(300);
  const body = await translateParagraphs((article.body || []).slice(0, 10), from);

  return {
    title,
    summary,
    body,
    section_label: sectionLabel(article.section),
    isTranslated: true,
    needsTranslation: false,
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
