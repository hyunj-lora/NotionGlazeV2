from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to dashboard (authenticated via middleware default)
    print("Navigating to dashboard...")
    page.goto("http://localhost:4321/dashboard")

    # Wait for page load
    page.wait_for_load_state("networkidle")

    # Take a screenshot of the dashboard
    print("Taking screenshot...")
    page.screenshot(path="dashboard_verification.png", full_page=True)

    # Verify EngineStatus button has aria-label
    sync_btn = page.locator("#sync-now-btn")
    if sync_btn.count() > 0:
        aria_label = sync_btn.get_attribute("aria-label")
        print(f"Sync Button Aria-Label: {aria_label}")
        if aria_label == "Trigger Manual Sync":
            print("SUCCESS: Sync button has correct aria-label.")
        else:
            print("FAILURE: Sync button missing correct aria-label.")

    # Check for ActivityList
    # Either look for status pills or empty state
    empty_state = page.locator("text=No posts synced yet")
    status_pills = page.locator(".bg-green-100") # or similar class I added

    if empty_state.count() > 0:
        print("FOUND: Empty state in ActivityList.")
    elif status_pills.count() > 0:
        print("FOUND: Activity items in ActivityList.")
    else:
        print("WARNING: Could not determine ActivityList state (maybe it's loading or empty without text match).")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
