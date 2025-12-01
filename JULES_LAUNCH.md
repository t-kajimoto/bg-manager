# Jules Launch & Verification Guide

This document outlines the procedures for starting the application, verifying changes with screenshots, and using the mock data mode for testing without Firebase.

## 1. Starting the Application

### Development Server
To start the Next.js development server:

```bash
npm run dev > dev_server.log 2>&1 &
```

Check the status:
```bash
jobs
tail -f dev_server.log
```

### Production Build (If dev server is unstable)
```bash
npm run build
npm run start > start.log 2>&1 &
```

## 2. Taking Screenshots (Frontend Verification)

We use Playwright for verifying frontend changes.

1.  Create a verification script (e.g., `verification/verify_change.py`).
2.  Import `sync_playwright`.
3.  Navigate to `http://localhost:3000`.
4.  Perform actions and assert states.
5.  Take a screenshot: `page.screenshot(path="verification/screenshot.png")`.
6.  Run the script: `python verification/verify_change.py`.
7.  View the screenshot: `read_image_file(filepath="verification/screenshot.png")`.
8.  Mark as complete: `frontend_verification_complete(screenshot_path="verification/screenshot.png")`.

Example script:
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")
    page.screenshot(path="verification/home.png")
    browser.close()
```

## 3. Mock Data Mode

To run the application with mock data (bypassing Firebase):

1.  Set the environment variable `NEXT_PUBLIC_USE_MOCK=true`.
    ```bash
    NEXT_PUBLIC_USE_MOCK=true npm run dev > dev_mock.log 2>&1 &
    ```
2.  The application will detect this flag and serve data from local mock sources instead of Firestore.
3.  Authentication will also be mocked (auto-login as a test user or admin).

**Note:** This mode is essential for testing logic without relying on the external Firebase environment, which might be flaky or restricted in the sandbox.
