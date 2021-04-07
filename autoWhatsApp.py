import selenium.webdriver as webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC
import time
import sys

def testClick(user_profile_path="", phone_number="2348100415220", message=""):
    options = webdriver.ChromeOptions()
    options.add_argument(user_profile_path)
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-extensions")
    options.add_argument("--proxy-server='direct://'")
    options.add_argument("--proxy-bypass-list=*")
    options.add_argument("--start-maximized")
    options.add_experimental_option('excludeSwitches', ['enable-logging'])
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('user-agent=User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36')
    # options.add_argument('--allow-running-insecure-content')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--no-sandbox')
    options.add_argument('--ignore-certificate-errors')
    driver = webdriver.Chrome(
    executable_path="chromedriver", options=options)

    driver.get("https://web.whatsapp.com/send?phone={}".format(phone_number))
    time.sleep(30)

    WebDriverWait(driver, 30, 0.5).until(EC.presence_of_element_located((By.XPATH, '/html/body/div/div[1]/div[1]/div[4]/div[1]/footer/div[1]/div[2]/div/div[2]'))).send_keys(message)
    WebDriverWait(driver, 10, 0.5).until(EC.element_to_be_clickable((By.XPATH, '/html/body/div/div[1]/div[1]/div[4]/div[1]/footer/div[1]/div[3]/button'))).click()
    driver.quit()

if __name__ == '__main__':
    testClick("user-data-dir=C:\\Users\\Gbolu\\AppData\\Local\\Google\\Chrome\\User Data\\", 
        phone_number=sys.argv[1], message=sys.argv[2])