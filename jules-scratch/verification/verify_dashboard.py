from playwright.sync_api import sync_playwright, Page, expect
import sys

def verify_frontend(page: Page):
    """
    This script verifies the core functionality of the TruScopeJournalismPlatform component.
    It enters text, runs an analysis, and captures a screenshot of the report or any resulting error.
    """
    # 1. Navigate to the application
    page.goto("http://localhost:5173/")

    # 2. Find the textarea and enter some content to analyze
    content_textarea = page.get_by_placeholder("Enter the article, claim, or text to analyze...")
    expect(content_textarea).to_be_visible()
    content_textarea.fill("A new study suggests that chocolate may be good for your health.")

    # 3. Click the "Verify & Analyze" button
    analyze_button = page.get_by_role("button", name="Verify & Analyze")
    expect(analyze_button).to_be_enabled()
    analyze_button.click()

    # 4. Wait for either the report heading or an error alert to appear
    report_heading = page.get_by_text("Final Credibility Score")
    error_alert = page.get_by_role("alert")

    # Use locator.or_() to wait for either locator to become visible
    expect(report_heading.or_(error_alert)).to_be_visible(timeout=30000)

    # 5. Check which element appeared and act accordingly
    if error_alert.is_visible():
        print("An error alert was displayed.", file=sys.stderr)
        error_text = error_alert.inner_text()
        print(f"Error message: {error_text}", file=sys.stderr)
        page.screenshot(path="jules-scratch/verification/verification-error.png")
        raise AssertionError(f"Analysis failed with UI error: {error_text}")
    else:
        print("Report panel appeared successfully.")
        expect(report_heading).to_be_visible()
        page.screenshot(path="jules-scratch/verification/verification.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_frontend(page)
        finally:
            browser.close()