from playwright.sync_api import sync_playwright
import time

def capture_screenshot(url, output_path, wait_time=3):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1200, 'height': 800})
        page.goto(url)
        
        # Wait for the page to load and animation to start
        time.sleep(wait_time)
        
        # Take screenshot
        page.screenshot(path=output_path, full_page=False)
        browser.close()
        print(f"Screenshot saved to {output_path}")

if __name__ == "__main__":
    # Capture rheostat
    capture_screenshot(
        "http://localhost:8000/rheostat/index.html",
        "/Users/tansk/SengKwang/Coding/sls-main/rheostat/rheostat.png",
        wait_time=2
    )
