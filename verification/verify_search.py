from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000", timeout=30000)
        page.wait_for_selector('text=Catan', timeout=20000)

        # Search for Catan
        page.get_by_label("検索").fill("Catan")
        page.wait_for_timeout(1000) # Wait for filter

        page.screenshot(path="verification/search_result.png")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/search_error.png")
    finally:
        browser.close()
