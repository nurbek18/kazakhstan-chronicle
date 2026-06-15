const SUPPORTED_LANGS = ['ru', 'kk', 'zh', 'en'];

const LANG_LABELS = {
  ru: 'РУС',
  kk: 'ҚАЗ',
  zh: '中文',
  en: 'ENG',
};

const UI = {
  ru: {
    siteTitle: 'Казахстан Хроника',
    siteSub: 'KAZAKHSTAN CHRONICLE',
    tagline: 'Новости Казахстана · Inform.kz · The Astana Times · Газетная вёрстка',
    editionLive: 'Онлайн',
    loading: 'Загрузка новостей…',
    loadingNews: 'Загрузка новостей Казахстана…',
    articlesCount: n => `Всего ${n} статей`,
    newsUpdated: t => `Обновлено: ${t}`,
    nav: { front: 'Главная', politics: 'Политика', economy: 'Экономика', culture: 'Культура', sports: 'Спорт', more: 'Ещё' },
    sportsHead: 'Спорт',
    societyHead: 'Общество',
    weatherHead: 'Погода и дороги',
    moreNews: 'Больше новостей',
    readFull: 'Читать полностью →',
    readOriginal: (src, lang) => `Оригинал на ${src} (${lang}) →`,
    readOriginalShort: src => `Читать на ${src} →`,
    backHome: '← На главную',
    noSports: 'Нет спортивных новостей',
    noSociety: 'Нет общественных новостей',
    articleNotFound: 'Статья не найдена.',
    loadError: 'Не удалось загрузить новости',
    loadErrorHint: 'Запустите <code>py server.py</code> для локального просмотра.',
    translating: 'Перевод статьи…',
    translationNote: 'Перевод выполнен автоматически. Оригинал может отличаться.',
    footer: 'Редакция · Астана и Алматы · Источники: Inform.kz, The Astana Times',
    footerNote: 'Обновление каждые 6 ч · Локально: <code>py server.py</code>',
    sections: { politics: 'Политика', economy: 'Экономика', culture: 'Культура', sports: 'Спорт', society: 'Общество' },
    weather: {
      unavailable: 'Данные недоступны',
      tomorrow: (lo, hi) => `Завтра: ${lo}° — ${hi}°C. Следите за погодой.`,
      codes: { 0: 'Ясно', 1: 'Преимущественно ясно', 2: 'Переменная облачность', 3: 'Пасмурно', 45: 'Туман', 48: 'Изморозь', 51: 'Морось', 61: 'Дождь', 71: 'Снег', 80: 'Ливень' },
      wind: w => `ветер ${w} км/ч`,
    },
    cities: { astana: 'Астана', almaty: 'Алматы' },
    refreshFail: 'Ошибка обновления',
    refreshStatic: 'Онлайн-версия обновляется каждые 6 часов.',
    fontSize: 'Размер шрифта',
    refresh: 'Обновить',
    chooseLang: 'Язык',
  },
  kk: {
    siteTitle: 'Қазақстан Хроникасы',
    siteSub: 'KAZAKHSTAN CHRONICLE',
    tagline: 'Қазақстан жаңалықтары · Inform.kz · The Astana Times · Газеттік беттеу',
    editionLive: 'Онлайн',
    loading: 'Жаңалықтар жүктелуде…',
    loadingNews: 'Қазақстан жаңалықтары жүктелуде…',
    articlesCount: n => `Барлығы ${n} мақала`,
    newsUpdated: t => `Жаңартылды: ${t}`,
    nav: { front: 'Басты бет', politics: 'Саясат', economy: 'Экономика', culture: 'Мәдениет', sports: 'Спорт', more: 'Тағы' },
    sportsHead: 'Спорт',
    societyHead: 'Қоғам',
    weatherHead: 'Ауа райы',
    moreNews: 'Көбірек жаңалықтар',
    readFull: 'Толық оқу →',
    readOriginal: (src, lang) => `Түпнұсқа ${src} (${lang}) →`,
    readOriginalShort: src => `${src} оқу →`,
    backHome: '← Басты бетке',
    noSports: 'Спорт жаңалықтары жоқ',
    noSociety: 'Қоғам жаңалықтары жоқ',
    articleNotFound: 'Мақала табылмады.',
    loadError: 'Жаңалықтарды жүктеу мүмкін болмады',
    loadErrorHint: 'Жергілікті қарау үшін <code>py server.py</code> іске қосыңыз.',
    translating: 'Аударма жасалуда…',
    translationNote: 'Автоматты аударма. Түпнұсқа мәтінге сәйкес келмеуі мүмкін.',
    footer: 'Редакция · Астана және Алматы · Inform.kz, The Astana Times',
    footerNote: '6 сағат сайын жаңартылады · Жергілікті: <code>py server.py</code>',
    sections: { politics: 'Саясат', economy: 'Экономика', culture: 'Мәдениет', sports: 'Спорт', society: 'Қоғам' },
    weather: {
      unavailable: 'Деректер жоқ',
      tomorrow: (lo, hi) => `Ертең: ${lo}° — ${hi}°C.`,
      codes: { 0: 'Ашық', 1: 'Көбінесе ашық', 2: 'Бұлтты', 3: 'Бұлтты', 45: 'Тұман', 48: 'Қырау', 51: 'Сіркіреу', 61: 'Жаңбыр', 71: 'Қар', 80: 'Нөсер' },
      wind: w => `жел ${w} км/сағ`,
    },
    cities: { astana: 'Астана', almaty: 'Алматы' },
    refreshFail: 'Жаңарту қатесі',
    refreshStatic: 'Онлайн нұсқа 6 сағат сайын жаңартылады.',
    fontSize: 'Қаріп өлшемі',
    refresh: 'Жаңарту',
    chooseLang: 'Тіл',
  },
  zh: {
    siteTitle: '哈萨克纪闻',
    siteSub: 'KAZAKHSTAN CHRONICLE',
    tagline: '哈萨克斯坦新闻 · Inform.kz · The Astana Times · 经典报纸版式',
    editionLive: '实时版',
    loading: '加载中…',
    loadingNews: '正在加载哈萨克斯坦新闻…',
    articlesCount: n => `共 ${n} 篇`,
    newsUpdated: t => `更新：${t}`,
    nav: { front: '头版', politics: '时政', economy: '财经', culture: '文化', sports: '体育', more: '更多' },
    sportsHead: '体坛快讯',
    societyHead: '社会见闻',
    weatherHead: '天气与出行',
    moreNews: '更多新闻',
    readFull: '阅读全文 →',
    readOriginal: (src, lang) => `阅读原文（${lang}）· ${src} →`,
    readOriginalShort: src => `在 ${src} 阅读原文 →`,
    backHome: '← 返回头版',
    noSports: '暂无体育新闻',
    noSociety: '暂无社会新闻',
    articleNotFound: '未找到该文章。',
    loadError: '无法加载新闻',
    loadErrorHint: '请使用 <code>py server.py</code> 启动本地服务器。',
    translating: '正在翻译文章…',
    translationNote: '以下为自动翻译，可能与原文有出入。',
    footer: '哈萨克纪闻社 · 阿斯塔纳与阿拉木图 · 来源：Inform.kz、The Astana Times',
    footerNote: '每 6 小时自动更新 · 本地：<code>py server.py</code>',
    sections: { politics: '时政', economy: '财经', culture: '文化', sports: '体育', society: '社会' },
    weather: {
      unavailable: '天气数据暂不可用',
      tomorrow: (lo, hi) => `明日预报：${lo}° — ${hi}°C，请注意天气变化。`,
      codes: { 0: '晴', 1: '大部晴朗', 2: '多云', 3: '阴', 45: '雾', 48: '雾凇', 51: '小雨', 61: '雨', 71: '雪', 80: '阵雨' },
      wind: w => `风速 ${w} km/h`,
    },
    cities: { astana: '阿斯塔纳', almaty: '阿拉木图' },
    refreshFail: '刷新失败',
    refreshStatic: '线上版每 6 小时自动更新。',
    fontSize: '调整字号',
    refresh: '刷新新闻',
    chooseLang: '语言',
  },
  en: {
    siteTitle: 'Kazakhstan Chronicle',
    siteSub: 'THE DAILY RECORD',
    tagline: 'News from Kazakhstan · Inform.kz · The Astana Times · Classic newspaper layout',
    editionLive: 'Live',
    loading: 'Loading…',
    loadingNews: 'Loading Kazakhstan news…',
    articlesCount: n => `${n} articles`,
    newsUpdated: t => `Updated: ${t}`,
    nav: { front: 'Front Page', politics: 'Politics', economy: 'Economy', culture: 'Culture', sports: 'Sports', more: 'More' },
    sportsHead: 'Sports',
    societyHead: 'Society',
    weatherHead: 'Weather & Travel',
    moreNews: 'More News',
    readFull: 'Read full story →',
    readOriginal: (src, lang) => `Original at ${src} (${lang}) →`,
    readOriginalShort: src => `Read on ${src} →`,
    backHome: '← Back to front page',
    noSports: 'No sports news',
    noSociety: 'No society news',
    articleNotFound: 'Article not found.',
    loadError: 'Could not load news',
    loadErrorHint: 'Run <code>py server.py</code> for local preview.',
    translating: 'Translating article…',
    translationNote: 'Machine translation — may differ from the original.',
    footer: 'Editorial · Astana & Almaty · Sources: Inform.kz, The Astana Times',
    footerNote: 'Updates every 6 h · Local: <code>py server.py</code>',
    sections: { politics: 'Politics', economy: 'Economy', culture: 'Culture', sports: 'Sports', society: 'Society' },
    weather: {
      unavailable: 'Data unavailable',
      tomorrow: (lo, hi) => `Tomorrow: ${lo}° — ${hi}°C. Check conditions before travel.`,
      codes: { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog', 51: 'Drizzle', 61: 'Rain', 71: 'Snow', 80: 'Showers' },
      wind: w => `wind ${w} km/h`,
    },
    cities: { astana: 'Astana', almaty: 'Almaty' },
    refreshFail: 'Refresh failed',
    refreshStatic: 'Online edition updates every 6 hours.',
    fontSize: 'Font size',
    refresh: 'Refresh',
    chooseLang: 'Language',
  },
};

const MYMEMORY_LANG = { ru: 'ru', kk: 'kk', zh: 'zh-CN', en: 'en' };
const ORIGINAL_LANG_NAME = { ru: 'Русский', kk: 'Қазақша', zh: '中文', en: 'English' };

let currentLang = localStorage.getItem('kc_lang') || 'ru';

function t(key, ...args) {
  const pack = UI[currentLang] || UI.ru;
  const val = key.split('.').reduce((o, k) => o?.[k], pack);
  return typeof val === 'function' ? val(...args) : (val ?? key);
}

function getLang() {
  return currentLang;
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem('kc_lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  applyStaticUI();
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

function applyStaticUI() {
  const map = {
    'site-title': t('siteTitle'),
    'site-sub': t('siteSub'),
    'site-tagline': t('tagline'),
    'edition-num': t('editionLive'),
    'nav-front': t('nav.front'),
    'nav-politics': t('nav.politics'),
    'nav-economy': t('nav.economy'),
    'nav-culture': t('nav.culture'),
    'nav-sports': t('nav.sports'),
    'nav-more': t('nav.more'),
    'sports-head': t('sportsHead'),
    'society-head': t('societyHead'),
    'weather-head': t('weatherHead'),
    'more-news-title': t('moreNews'),
    'footer-text': t('footer'),
    'footer-note': t('footerNote'),
    'loading-text': t('loadingNews'),
  };
  Object.entries(map).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  const fontBtn = document.getElementById('font-toggle');
  const refreshBtn = document.getElementById('refresh-toggle');
  if (fontBtn) {
    fontBtn.title = t('fontSize');
    fontBtn.setAttribute('aria-label', t('fontSize'));
  }
  if (refreshBtn) {
    refreshBtn.title = t('refresh');
    refreshBtn.setAttribute('aria-label', t('refresh'));
  }

  document.title = `${t('siteTitle')} | ${t('siteSub')}`;
}

function initLangSwitcher() {
  const host = document.getElementById('lang-switcher');
  if (!host) return;
  host.innerHTML = SUPPORTED_LANGS.map(lang => `
    <button type="button" class="lang-btn${lang === currentLang ? ' active' : ''}" data-lang="${lang}" title="${LANG_LABELS[lang]}">${LANG_LABELS[lang]}</button>
  `).join('');
  host.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  applyStaticUI();
}

function sectionLabel(section) {
  return t('sections')[section] || section;
}

function getLocalizedArticle(article, lang = currentLang) {
  if (!article) return null;
  const src = article.lang || 'ru';
  if (lang === src) {
    return {
      title: article.title,
      summary: article.summary,
      body: article.body || [],
      section_label: sectionLabel(article.section),
      isTranslated: false,
    };
  }
  const tr = article.translations?.[lang];
  if (tr?.title) {
    const hasBody = tr.body?.length > 0;
    return {
      title: tr.title,
      summary: tr.summary || article.summary,
      body: hasBody ? tr.body : (article.body || []),
      section_label: sectionLabel(article.section),
      isTranslated: lang !== src,
      needsTranslation: !hasBody && lang !== src,
    };
  }
  return {
    title: article.title,
    summary: article.summary,
    body: article.body || [],
    section_label: sectionLabel(article.section),
    isTranslated: false,
    needsTranslation: true,
  };
}

function formatDateTime(iso, lang = currentLang) {
  const locale = { ru: 'ru-RU', kk: 'kk-KZ', zh: 'zh-CN', en: 'en-GB' }[lang] || 'ru-RU';
  try {
    return new Date(iso).toLocaleString(locale, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function setDateLine() {
  const el = document.getElementById('date-line');
  if (!el) return;
  const locale = { ru: 'ru-RU', kk: 'kk-KZ', zh: 'zh-CN', en: 'en-GB' }[currentLang] || 'ru-RU';
  el.textContent = new Date().toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher();
  setDateLine();
});

window.addEventListener('langchange', () => setDateLine());
