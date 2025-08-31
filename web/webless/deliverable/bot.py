from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

options = Options()
options.add_argument("--headless")
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")

service = Service()  # Selenium Manager will handle chromedriver

def run_report(url, username, password):
    try:
        driver = webdriver.Chrome(service=service, options=options)

        # Login page
        driver.get(f"http://127.0.0.1:5000/login?username={username}&password={password}")

        # Wait until page is loaded (document.readyState == "complete")
        WebDriverWait(driver, 10).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        print("Login page fully loaded")

        # Navigate to report page
        print("Visiting:", url)
        driver.get(url)

        WebDriverWait(driver, 10).until(
            lambda d: d.execute_script("return window.reportReady === true")
        )
        print("Report page fully loaded")

    except Exception as e:
        print(f"[BOT] Error: {e}")
    finally:
        driver.quit()
        print("Browser closed.")
