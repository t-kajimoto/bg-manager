from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000", timeout=30000)
        # Wait for content to load
        page.wait_for_selector('text=Catan', timeout=20000)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        page.screenshot(path="verification/mock_mode.png")
        browser.close()
