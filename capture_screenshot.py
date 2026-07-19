"""Capture previews for every app card that does not yet have an image."""

import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"
BASE_URL = "http://127.0.0.1:8000"


def missing_card_folders():
    source = INDEX.read_text(encoding="utf-8")
    apps_source = source.split("const apps = ", 1)[1].split(";", 1)[0]
    return [app["folder"] for app in json.loads(apps_source) if not app["screenshot"]]


def capture_missing_previews(wait_ms=1500):
    folders = missing_card_folders()
    failures = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context(
            viewport={"width": 1200, "height": 800},
            device_scale_factor=1,
            permissions=[],
        )

        for position, folder in enumerate(folders, start=1):
            page = context.new_page()
            output = ROOT / folder / f"{folder.lower()}.png"
            try:
                page.goto(
                    f"{BASE_URL}/{folder}/index.html",
                    wait_until="domcontentloaded",
                    timeout=20_000,
                )
                page.wait_for_timeout(wait_ms)
                page.screenshot(path=str(output), full_page=False)
                print(f"[{position:02}/{len(folders)}] {output.relative_to(ROOT)}")
            except Exception as error:  # Continue so one unusual app does not block all cards.
                failures.append((folder, str(error).splitlines()[0]))
                print(f"[{position:02}/{len(folders)}] FAILED {folder}: {failures[-1][1]}")
            finally:
                page.close()

        browser.close()

    return failures


if __name__ == "__main__":
    failed = capture_missing_previews()
    if failed:
        raise SystemExit(f"Could not capture {len(failed)} preview(s): {failed}")
