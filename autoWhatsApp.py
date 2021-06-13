from deleteProfileDirs import deleteDir
import selenium.webdriver as webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains, ActionBuilder
import selenium.webdriver.support.expected_conditions as EC
from closeCrmInstance import findProcessPid, closeProcess
import sys,time

def autoWhatsApp(user_profile_path, phone_number='2348100415220', message='', executable_path="/home/gboluwagaadeyemi/code_files/auto_whatsapp/chromedriver"):
    options = webdriver.ChromeOptions()
    options.add_argument('--no-sandbox')
    options.binary_location = "/usr/bin/google-chrome-stable"
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
    options.add_argument('--allow-running-insecure-content')
    options.add_argument('--ignore-certificate-errors')
    driver = webdriver.Chrome(
    executable_path=executable_path, options=options)

    message.replace('\\\n', '\\n')

    messages = message.split('\\n')
    print(messages)

    driver.get("https://web.whatsapp.com/send?phone={}".format(phone_number))
    textElement = WebDriverWait(driver, 60, 0.5).until(EC.presence_of_element_located((By.XPATH, '/html/body/div/div[1]/div[1]/div[4]/div[1]/footer/div[1]/div[2]/div/div[2]')))
    driver_action_chains = ActionChains(driver)
    for text in messages:
        driver_action_chains.click(textElement)
        driver_action_chains.perform()
        driver_action_chains.reset_actions()
        textElement.send_keys(text)
        driver_action_chains.move_to_element(textElement)
        driver_action_chains.click()
        driver_action_chains.key_down(Keys.ARROW_RIGHT)
        driver_action_chains.perform()
        driver_action_chains.reset_actions()
        time.sleep(1)
        driver_action_chains.release()
        driver_action_chains.key_down(Keys.SHIFT)
        driver_action_chains.send_keys(Keys.ENTER)
        driver_action_chains.release()
        driver_action_chains.perform()
        driver_action_chains.reset_actions()

    WebDriverWait(driver, 60, 0.5).until(EC.element_to_be_clickable((By.XPATH, '/html/body/div/div[1]/div[1]/div[4]/div[1]/footer/div[1]/div[3]/button'))).click()
    # close any lingering processes 
    for text in messages:
        if text not in driver.page_source:
            raise Exception("Failed to send message.")
            break
    try:
        driver.close()
        driver.quit()   
    finally:
        print('Message to {} has been sent!'.format(phone_number))
        pass
if __name__ == '__main__':
    deleteDir('./user-data/"Local State"')
    deleteDir('./user-data/Default/Preferences')
    autoWhatsApp("--user-data-dir=/home/gboluwagaadeyemi/code_files/auto_whatsapp_slave/user-data", 
        phone_number=sys.argv[1], message=sys.argv[2])
    closeProcess(findProcessPid("chrome"))
