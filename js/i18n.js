const UI = {
  siteTitle: '哈萨克斯坦纪闻',
  siteSub: 'KAZAKHSTAN DAILY',
  tagline: '哈萨克斯坦真实新闻 · Inform.kz · 阿斯塔纳时报 · 经典报纸版式',
  editionLive: '每日电讯',
  loadingNews: '正在加载哈萨克斯坦新闻…',
  articlesCount: n => `本日共 ${n} 篇`,
  newsUpdated: t => `新闻更新：${t}`,
  nav: { front: '头版', politics: '时政', economy: '财经', culture: '文化', sports: '体育', more: '更多' },
  sportsHead: '体坛快讯',
  societyHead: '社会见闻',
  weatherHead: '天气与出行',
  moreNews: '更多新闻',
  readFull: '阅读全文 →',
  readOriginal: src => `阅读原文（${src}）→`,
  backHome: '← 返回头版',
  noSports: '暂无体育新闻',
  noSociety: '暂无社会新闻',
  articleNotFound: '未找到该文章。',
  loadError: '无法加载新闻',
  loadErrorHint: '请使用 <code>py server.py</code> 启动本地服务器。',
  translating: '正在翻译为中文…',
  translationNote: '本文由机器自动翻译，仅供参考，请以原文为准。',
  footer: '哈萨克斯坦纪闻社 · 阿斯塔纳 & 阿拉木图 · 来源：Inform.kz、阿斯塔纳时报',
  footerNote: '每 6 小时自动更新新闻',
  sections: { politics: '时政', economy: '财经', culture: '文化', sports: '体育', society: '社会' },
  weather: {
    unavailable: '天气数据暂不可用',
    tomorrow: (lo, hi) => `明日预报：气温 ${lo}° — ${hi}°C，出行请留意天气变化。`,
    codes: { 0: '晴', 1: '大部晴朗', 2: '多云', 3: '阴', 45: '雾', 48: '雾凇', 51: '小雨', 61: '雨', 71: '雪', 80: '阵雨' },
    wind: w => `风速 ${w} 公里/小时`,
  },
  cities: { astana: '阿斯塔纳', almaty: '阿拉木图' },
  refreshFail: '刷新失败',
  refreshStatic: '线上版每 6 小时自动更新，请稍后再试。',
  fontSize: '调整字号',
  refresh: '刷新新闻',
};

const CONTENT_LANG = 'zh';

function t(key, ...args) {
  const val = key.split('.').reduce((o, k) => o?.[k], UI);
  return typeof val === 'function' ? val(...args) : (val ?? key);
}

function sectionLabel(section) {
  return UI.sections[section] || section;
}

function sourceName(name) {
  if (!name) return '';
  if (name === 'Inform.kz') return '哈萨克通讯社';
  if (name.includes('Astana') || name.includes('阿斯塔纳')) return '阿斯塔纳时报';
  return name;
}

function getLocalizedArticle(article) {
  if (!article) return null;
  const src = article.lang || 'ru';
  const tr = article.translations?.zh;

  if (tr?.title) {
    const hasBody = tr.body?.length > 0;
    return {
      title: tr.title,
      summary: tr.summary || article.summary,
      body: hasBody ? tr.body : (article.body || []),
      section_label: sectionLabel(article.section),
      isTranslated: src !== 'zh',
      needsTranslation: !hasBody && src !== 'zh',
    };
  }

  if (src === 'zh') {
    return {
      title: article.title,
      summary: article.summary,
      body: article.body || [],
      section_label: sectionLabel(article.section),
      isTranslated: false,
      needsTranslation: false,
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

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function setDateLine() {
  const el = document.getElementById('date-line');
  if (!el) return;
  const now = new Date();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  el.textContent = `哈萨克斯坦 ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
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
    fontBtn.textContent = '字';
    fontBtn.title = t('fontSize');
    fontBtn.setAttribute('aria-label', t('fontSize'));
  }
  if (refreshBtn) {
    refreshBtn.title = t('refresh');
    refreshBtn.setAttribute('aria-label', t('refresh'));
  }

  document.documentElement.lang = 'zh-CN';
  document.title = `${t('siteTitle')} | ${t('siteSub')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  applyStaticUI();
  setDateLine();
});
