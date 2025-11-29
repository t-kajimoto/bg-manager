from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000", timeout=30000)
        page.wait_for_selector('text=Catan', timeout=20000)

        # Open Gacha
        page.get_by_role("button", name="ガチャ").click()
        page.wait_for_selector('text=ボドゲガチャ', timeout=5000)

        # Run Gacha (default settings)
        page.get_by_role("button", name="ガチャ実行").click()

        # Verify result (Snackbar or Search box filled)
        page.wait_for_timeout(2000) # Wait for animation

        page.screenshot(path="verification/gacha_result.png")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/gacha_error.png")
    finally:
        browser.close()
