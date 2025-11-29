from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000", timeout=30000)
        page.wait_for_selector('text=MockNick', timeout=20000)

        # Open User Menu
        page.get_by_text("MockNick").click()

        # Click Edit Nickname
        page.get_by_role("menuitem", name="ニックネームを編集").click()

        # Fill new nickname
        page.wait_for_selector('text=ニックネームを編集', timeout=5000)
        page.get_by_role("textbox", name="ニックネーム").fill("NewNick")

        # Save
        page.get_by_role("button", name="保存").click()

        # Verify new nickname in header
        page.wait_for_selector('text=NewNick', timeout=5000)

        page.screenshot(path="verification/nickname_result.png")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/nickname_error.png")
    finally:
        browser.close()
