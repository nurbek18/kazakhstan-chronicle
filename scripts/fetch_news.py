#!/usr/bin/env python3
"""Fetch real Kazakhstan news from RSS feeds and save to data/news.json."""

from __future__ import annotations

import hashlib
import html
import json
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "news.json"

USER_AGENT = "KazakhstanChronicle/1.0 (+local news aggregator)"
TIMEOUT = 20

NS = {
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}

FEEDS = [
    {"id": "inform_politics", "url": "https://www.inform.kz/rss/p_ru.xml", "source": "Inform.kz", "lang": "ru", "default_section": "politics"},
    {"id": "inform_news", "url": "https://www.inform.kz/rss/ru.xml", "source": "Inform.kz", "lang": "ru", "default_section": "society"},
    {"id": "inform_president", "url": "https://www.inform.kz/rss/presidentru.xml", "source": "Inform.kz", "lang": "ru", "default_section": "politics"},
    {"id": "inform_economy", "url": "https://www.inform.kz/rss/inform_kz_exhange_ru.xml", "source": "Inform.kz", "lang": "ru", "default_section": "economy"},
    {"id": "astana_times", "url": "https://astanatimes.com/feed/", "source": "阿斯塔纳时报", "lang": "en", "default_section": "society"},
]

SECTION_KEYWORDS = {
    "politics": [
        "президент", "парламент", "правительств", "министр", "внешн", "дипломат",
        "president", "parliament", "government", "minister", "diplomat", "election", "party",
    ],
    "economy": [
        "эконом", "бизнес", "инвест", "банк", "нефт", "газ", "тенге", "бюджет", "рынок",
        "econom", "business", "invest", "bank", "budget", "market", "trade", "finance",
    ],
    "culture": [
        "культур", "искусств", "музе", "театр", "кино", "фестиваль", "наслед",
        "culture", "museum", "theatre", "theater", "festival", "heritage", "art",
    ],
    "sports": [
        "спорт", "футбол", "бокс", "теннис", "олимп", "чемпион", "матч",
        "sport", "football", "soccer", "boxing", "tennis", "olympic", "champion", "match",
    ],
}

SECTION_LABELS = {
    "politics": "politics",
    "economy": "economy",
    "culture": "culture",
    "sports": "sports",
    "society": "society",
}

TARGET_LANGS = ["zh"]
MYMEMORY = {"ru": "ru", "en": "en", "zh": "zh-CN", "kk": "kk"}


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
        return resp.read()


def strip_html(text: str) -> str:
    if not text:
        return ""
    text = html.unescape(text)
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_image_from_html(text: str) -> str | None:
    if not text:
        return None
    for pattern in (
        r'<media:content[^>]+url="([^"]+)"',
        r'<img[^>]+src="([^"]+)"',
        r'src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
    ):
        match = re.search(pattern, text, flags=re.I)
        if match:
            return match.group(1)
    return None


def fetch_og_image(url: str) -> str | None:
    try:
        raw = fetch_bytes(url).decode("utf-8", errors="replace")
    except (urllib.error.URLError, TimeoutError, OSError):
        return None
    match = re.search(r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', raw, flags=re.I)
    if match:
        return match.group(1)
    match = re.search(r'content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', raw, flags=re.I)
    return match.group(1) if match else None


def parse_date(value: str | None) -> str:
    if not value:
        return datetime.now(timezone.utc).isoformat()
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        pass
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).isoformat()
    except ValueError:
        return datetime.now(timezone.utc).isoformat()


def classify_section(title: str, summary: str, rss_category: str | None, default: str) -> str:
    if rss_category:
        cat = rss_category.lower()
        if any(k in cat for k in ("sport", "спорт")):
            return "sports"
        if any(k in cat for k in ("econom", "business", "finance", "эконом", "бизнес")):
            return "economy"
        if any(k in cat for k in ("culture", "art", "культур")):
            return "culture"
        if any(k in cat for k in ("politic", "president", "полит", "президент")):
            return "politics"

    haystack = f"{title} {summary}".lower()
    scores = {section: 0 for section in SECTION_KEYWORDS}
    for section, keywords in SECTION_KEYWORDS.items():
        for kw in keywords:
            if kw in haystack:
                scores[section] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else default


def make_id(link: str) -> str:
    return hashlib.md5(link.encode("utf-8")).hexdigest()[:12]


def split_paragraphs(text: str) -> list[str]:
    chunks = [c.strip() for c in re.split(r"\n+|\.\s+", text) if c.strip()]
    if len(chunks) <= 1 and len(text) > 280:
        chunks = [text[i : i + 280].strip() for i in range(0, len(text), 280)]
    paragraphs: list[str] = []
    buffer = ""
    for chunk in chunks:
        if not buffer:
            buffer = chunk
        elif len(buffer) + len(chunk) < 320:
            buffer = f"{buffer}. {chunk}" if not buffer.endswith(".") else f"{buffer} {chunk}"
        else:
            paragraphs.append(buffer if buffer.endswith(".") else f"{buffer}.")
            buffer = chunk
    if buffer:
        paragraphs.append(buffer if buffer.endswith(".") else f"{buffer}.")
    return paragraphs[:12]


def parse_feed(feed: dict) -> list[dict]:
    articles: list[dict] = []
    try:
        xml = fetch_bytes(feed["url"])
        root = ET.fromstring(xml)
    except (urllib.error.URLError, ET.ParseError, TimeoutError, OSError) as exc:
        print(f"[warn] feed failed {feed['id']}: {exc}")
        return articles

    for item in root.findall(".//item"):
        title = strip_html(item.findtext("title") or "")
        link = (item.findtext("link") or "").strip()
        if not title or not link:
            continue

        encoded = ""
        for tag in ("{http://purl.org/rss/1.0/modules/content/}encoded", "encoded"):
            node = item.find(tag)
            if node is not None and node.text:
                encoded = node.text
                break

        description = strip_html(item.findtext("description") or "")
        summary_source = strip_html(encoded) or description
        summary = summary_source[:320] + ("…" if len(summary_source) > 320 else "")

        media = item.find(".//{http://search.yahoo.com/mrss/}content")
        if media is None:
            media = item.find(".//{http://search.yahoo.com/mrss/}thumbnail")
        image = media.get("url") if media is not None else None
        if not image:
            image = extract_image_from_html(encoded or item.findtext("description") or "")

        category = item.findtext("category")
        section = classify_section(title, summary_source, category, feed["default_section"])

        author = item.findtext("{http://purl.org/dc/elements/1.1/}creator") or item.findtext("author")
        pub_date = parse_date(item.findtext("pubDate"))

        body_text = summary_source
        if len(body_text) < 120:
            body_text = f"{title}. {body_text}".strip()

        articles.append(
            {
                "id": make_id(link),
                "title": title,
                "summary": summary,
                "body": split_paragraphs(body_text),
                "link": link,
                "image": image,
                "section": section,
                "source": feed["source"],
                "lang": feed["lang"],
                "author": author or feed["source"],
                "published": pub_date,
                "feed": feed["id"],
            }
        )
    return articles


def enrich_images(articles: list[dict], limit: int = 30) -> None:
    fetched = 0
    for article in articles:
        if article.get("image") or fetched >= limit:
            continue
        image = fetch_og_image(article["link"])
        if image:
            article["image"] = image
            fetched += 1


def translate_mymemory(text: str, src: str, dest: str) -> str:
    if not text or src == dest:
        return text
    src_code = MYMEMORY.get(src, src)
    dest_code = MYMEMORY.get(dest, dest)
    chunk = text[:480]
    query = urllib.parse.urlencode({"q": chunk, "langpair": f"{src_code}|{dest_code}"})
    url = f"https://api.mymemory.translated.net/get?{query}"
    try:
        raw = fetch_bytes(url)
        data = json.loads(raw.decode("utf-8"))
        return data.get("responseData", {}).get("translatedText") or text
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError, OSError):
        return text


def add_translations(articles: list[dict], summary_limit: int = 210, body_limit: int = 25) -> None:
    for i, article in enumerate(articles):
        src = article.get("lang", "ru")
        translations: dict[str, dict] = {}
        if src == "zh":
            translations["zh"] = {
                "title": article["title"],
                "summary": article["summary"],
                "body": article.get("body", []),
            }
        elif i < summary_limit:
            body_out = []
            if i < body_limit:
                for para in article.get("body", [])[:8]:
                    body_out.append(translate_mymemory(para, src, "zh"))
                    time.sleep(0.3)
            translations["zh"] = {
                "title": translate_mymemory(article["title"], src, "zh"),
                "summary": translate_mymemory(article["summary"], src, "zh"),
                "body": body_out,
            }
            time.sleep(0.3)

        article["translations"] = translations
        if (i + 1) % 20 == 0:
            print(f"[translate] {i + 1}/{len(articles)} articles")


def fetch_weather() -> dict:
    cities = {
        "astana": {"lat": 51.16, "lon": 71.47},
        "almaty": {"lat": 43.24, "lon": 76.95},
    }
    result = {}
    for key, city in cities.items():
        url = (
            "https://api.open-meteo.com/v1/forecast?"
            f"latitude={city['lat']}&longitude={city['lon']}"
            "&current=temperature_2m,weather_code,wind_speed_10m"
            "&daily=temperature_2m_max,temperature_2m_min,weather_code"
            "&timezone=Asia%2FAlmaty&forecast_days=2"
        )
        try:
            raw = fetch_bytes(url)
            data = json.loads(raw.decode("utf-8"))
            current = data.get("current", {})
            daily = data.get("daily", {})
            result[key] = {
                "temp": current.get("temperature_2m"),
                "wind": current.get("wind_speed_10m"),
                "weather_code": current.get("weather_code"),
                "high": daily.get("temperature_2m_max", [None])[0],
                "low": daily.get("temperature_2m_min", [None])[0],
                "tomorrow_high": daily.get("temperature_2m_max", [None, None])[1],
                "tomorrow_low": daily.get("temperature_2m_min", [None, None])[1],
            }
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError, OSError):
            result[key] = {"temp": None}
    return result


def dedupe_sort(articles: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []
    for article in sorted(articles, key=lambda a: a["published"], reverse=True):
        key = article["title"].lower().strip()
        if key in seen:
            continue
        seen.add(key)
        unique.append(article)
    return unique


def group_by_section(articles: list[dict]) -> dict[str, list[dict]]:
    grouped = {key: [] for key in SECTION_LABELS}
    for article in articles:
        grouped.setdefault(article["section"], []).append(article)
    return grouped


def build_payload() -> dict:
    all_articles: list[dict] = []
    for feed in FEEDS:
        items = parse_feed(feed)
        print(f"[ok] {feed['id']}: {len(items)} articles")
        all_articles.extend(items)

    all_articles = dedupe_sort(all_articles)
    enrich_images(all_articles, limit=35)
    print("[info] translating all articles to Chinese…")
    add_translations(all_articles, summary_limit=210, body_limit=25)

    grouped = group_by_section(all_articles)
    lead = all_articles[0] if all_articles else None

    return {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "total": len(all_articles),
        "lead": lead,
        "articles": all_articles,
        "by_section": grouped,
        "weather": fetch_weather(),
        "sources": [feed["source"] for feed in FEEDS],
    }


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    payload = build_payload()
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {payload['total']} articles -> {OUTPUT}")


if __name__ == "__main__":
    main()
