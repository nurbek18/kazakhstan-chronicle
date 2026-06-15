import urllib.request
import xml.etree.ElementTree as ET
import re
import json

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()

NS = {
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}

xml = fetch("https://www.inform.kz/rss/p_ru.xml")
root = ET.fromstring(xml)
item = root.find(".//item")
print("INFORM ITEM KEYS:")
for child in item:
    tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
    text = (child.text or "")[:200]
    print(f"  {tag}: {text}")

link = item.findtext("link")
print("\nFetching article page for og:image...")
html = fetch(link).decode("utf-8", errors="replace")
og = re.search(r'property="og:image" content="([^"]+)"', html)
print("og:image:", og.group(1) if og else None)

xml2 = fetch("https://astanatimes.com/feed/")
root2 = ET.fromstring(xml2)
item2 = root2.find(".//item")
print("\nASTANA ITEM:")
for child in item2:
    tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
    text = (child.text or "")[:200]
    print(f"  {tag}: {text}")

link2 = item2.findtext("link")
html2 = fetch(link2).decode("utf-8", errors="replace")
og2 = re.search(r'property="og:image" content="([^"]+)"', html2)
print("og:image:", og2.group(1) if og2 else None)
