const translateCache = new Map();
const LANG_CODE = { ru: 'ru', kk: 'kk', zh: 'zh-CN', en: 'en' };

function cacheKey(text, from, to) {
  return `${from}|${to}|${text.slice(0, 80)}`;
}

function hasChinese(text) {
  return /[\u4e00-\u9fff]/.test(text || '');
}

async function translateViaGoogle(text, from, to = 'zh') {
  const sl = LANG_CODE[from] || from;
  const tl = LANG_CODE[to] || to;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text.slice(0, 2000))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('翻译失败');
  const data = await res.json();
  return data[0].map(p => p[0]).join('');
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

  let translated = text;
  try {
    translated = await translateViaGoogle(text, from, to);
  } catch {
    const src = LANG_CODE[from] || from;
    const dest = LANG_CODE[to] || to;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${src}|${dest}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      translated = data.responseData?.translatedText || text;
    }
  }

  translateCache.set(key, translated);
  try { sessionStorage.setItem(`tr:${key}`, translated); } catch { /* quota */ }
  return translated;
}

async function translateParagraphs(paragraphs, from) {
  const out = [];
  for (const p of paragraphs) {
    out.push(await translateText(p, from, 'zh'));
    await sleep(200);
  }
  return out;
}

async function translateArticleFields(article) {
  const from = article.lang || 'ru';
  const loc = getLocalizedArticle(article);
  if (!loc.needsTranslation) return loc;

  const title = await translateText(article.title, from, 'zh');
  const summary = await translateText(article.summary, from, 'zh');
  const body = loc.body?.length && hasChinese(loc.body[0])
    ? loc.body
    : await translateParagraphs((article.body || []).slice(0, 10), from);

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
