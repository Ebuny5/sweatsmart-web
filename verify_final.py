import asyncio
from playwright.async_api import async_playwright
import os

async def verify_app():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Check landing page
            print("Checking landing page...")
            await page.goto("http://localhost:8080/")
            await page.wait_for_timeout(2000)
            await page.screenshot(path="verification/screenshots/landing_page_final.png")

            title = await page.title()
            print(f"Landing page title: {title}")

            # Check insights page (should redirect to login)
            print("Checking insights page...")
            await page.goto("http://localhost:8080/insights")
            await page.wait_for_timeout(2000)
            await page.screenshot(path="verification/screenshots/insights_redirect.png")
            print(f"Current URL after navigating to /insights: {page.url}")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    asyncio.run(verify_app())
