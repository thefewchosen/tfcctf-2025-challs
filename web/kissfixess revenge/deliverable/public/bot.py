import tempfile
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import sys
from urllib.parse import quote

URL_BASE = "http://localhost:8000"

def visit_url(name: str, timeout: int = 30):
  chrome_opts = Options()
  chrome_opts.add_argument("--headless=new")
  chrome_opts.add_argument("--disable-gpu")
  chrome_opts.add_argument("--disable-dev-shm-usage")
  chrome_opts.add_argument("--disable-extensions")
  chrome_opts.add_argument("--disable-popup-blocking")
  chrome_opts.add_argument("--blink-settings=imagesEnabled=false")  # don't load images
  chrome_opts.add_argument("--log-level=3")  # reduce logging
  chrome_opts.add_argument("--no-sandbox")
  
  user_data_dir = tempfile.mkdtemp(prefix="chrome-profile-")
  chrome_opts.add_argument(f"--user-data-dir={user_data_dir}")  # use a temporary user data directory
  
  
  chrome_opts.add_argument("--user-data-dir=/tmp/chrome")  # use a temporary user data directory
  
  driver = webdriver.Chrome(options=chrome_opts)
  
  try:
    driver.set_page_load_timeout(timeout)
    driver.set_script_timeout(5)
    driver.get(URL_BASE)
    driver.add_cookie({
        "name": "flag",
        "value": "TFCCTF{~}",
    })
    
    encoded_name = quote(name)
    driver.get(f"{URL_BASE}/?name_input={encoded_name}")
    # allow some time for JS to execute
    time.sleep(200)
    driver.quit()
  finally:
    driver.quit()
