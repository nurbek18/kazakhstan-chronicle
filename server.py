#!/usr/bin/env python3
"""Local server: static files + news API + refresh endpoint."""

from __future__ import annotations

import json
import subprocess
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
FETCH_SCRIPT = ROOT / "scripts" / "fetch_news.py"
NEWS_FILE = ROOT / "data" / "news.json"
PORT = 8080


class NewsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/news":
            self.serve_news()
            return
        if parsed.path == "/api/refresh":
            self.refresh_news()
            return
        super().do_GET()

    def serve_news(self) -> None:
        if not NEWS_FILE.exists():
            self.refresh_news(silent=True)
        if not NEWS_FILE.exists():
            self.send_error(503, "News data not available")
            return
        data = NEWS_FILE.read_text(encoding="utf-8")
        body = data.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def refresh_news(self, silent: bool = False) -> None:
        try:
            subprocess.run([sys.executable, str(FETCH_SCRIPT)], check=True, cwd=str(ROOT))
            payload = json.loads(NEWS_FILE.read_text(encoding="utf-8"))
            body = json.dumps({"ok": True, "total": payload.get("total", 0)}, ensure_ascii=False).encode("utf-8")
            status = 200
        except (subprocess.CalledProcessError, OSError, json.JSONDecodeError) as exc:
            body = json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False).encode("utf-8")
            status = 500

        if silent:
            return

        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args) -> None:
        if str(args[0]).startswith("GET /api"):
            return
        super().log_message(fmt, *args)


def main() -> None:
    if not NEWS_FILE.exists():
        print("First run: fetching Kazakhstan news...")
        subprocess.run([sys.executable, str(FETCH_SCRIPT)], cwd=str(ROOT))

    server = ThreadingHTTPServer(("localhost", PORT), NewsHandler)
    print(f"Kazakhstan Chronicle running at http://localhost:{PORT}")
    print("API: /api/news  |  Refresh: /api/refresh")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
