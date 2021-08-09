const { Builder, Capabilities, until, By, Key } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
const path = require('path');
const rimraf = require('rimraf');
const logger  = require("./logger");
const AppError = require('./appError');

class AnonMessenger {
  /**
   * @param {Array<String>} browser_options_args
   */
  constructor(browser_options_args = [], browser_type, user_data_dir = null) {
    this.browser_options_args = browser_options_args;
    this.browser_type = browser_type;
    this.user_data_dir = user_data_dir;
  }

  async chromeInit() {
    this.browser_options_args.push(`user-data-dir=${this.user_data_dir}`);
    let chromeOptions = new chrome.Options();

    for (let arg of this.browser_options_args) {
      chromeOptions.addArguments(arg);
    }

    try {
      let driver = await new Builder()
        .forBrowser("chrome")
        .withCapabilities(Capabilities.chrome())
        .setChromeOptions(chromeOptions)
        .build();

      this.driver = driver;
      logger.info(`Created Selenium driver for chrome...`);
    } catch (error) {
      throw new Error(error);
    }
  }

  async firefoxInit() {
    let firefoxOptions = new firefox.Options();
    firefoxOptions.setProfile(this.user_data_dir);
    firefoxOptions.headless();
    firefoxOptions.windowSize({ width: 1920, height: 1080 });

    try {
      let driver = await new Builder()
        .forBrowser("firefox")
        .setFirefoxOptions(firefoxOptions)
        .build();
      this.driver = driver;
      logger.info(`Created Selenium driver for firefox...`);
    } catch (error) {
      throw new Error(error);
    }
  }

  async edgeInit() {
    this.browser_options_args.push(`user-data-dir=${this.user_data_dir}`);

    let edgeOptions = new edge.Options();
    // edgeOptions.set('useChromium', true);
    edgeOptions.addArguments(this.browser_options_args);
    edgeOptions.setBinaryPath(process.env.EDGE_BINARY);
    // edgeOptions.headless();
    let driver;

    try {
      driver = await new Builder()
        .forBrowser("MicrosoftEdge")
        .setEdgeOptions(edgeOptions)
        .build();
      this.driver = driver;
      logger.info(`Created Selenium driver for Edge...`);
    } catch (error) {
      logger.error(error);
    }
  }

  validateMessage(message='') {
    return new Promise((resolve, reject) => {
      let messages = message.split('\n');
  
      messages.forEach(text => {
        //  regex used to check for emojis
        const emojiRegexExp =
          /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
    
        //  check for the presence of emojis in text
        let emojiRegexTestResults = emojiRegexExp.exec(text);
        if (emojiRegexTestResults != null) 
        reject(new AppError("Emojis are not allowed.", ));
      })

      resolve(null);
    })
  }

  async #navigateTo(link) {
    let windowHandles;
    let baseWindowHandle;
    let targetWindowHandle;

    await this.driver.executeScript(
      `window.open('${link}')`
    );
    windowHandles = await this.driver.getAllWindowHandles();
    baseWindowHandle = await this.driver.getWindowHandle();
    targetWindowHandle = windowHandles.filter(
      (windowHandle) => windowHandle != baseWindowHandle
    )[0];
    await this.driver.switchTo().window(targetWindowHandle);

    return baseWindowHandle;
  }

  async sendWhatsAppMessage(phone_number = "2348186511634", message = "") {
    //  split message by new line character
    let messages = message.split("\n");

    //  remove empty characters from message
    messages = messages.filter((message) => message !== "");

    let baseWindowHandle;

    //  navigate to the whatsapp web webpage in a new tab
    try {
      baseWindowHandle = await this.#navigateTo(
        `https://web.whatsapp.com/send?phone=${phone_number}`
      );

      //  select text field used to input messages
      let textElement = await this.driver.wait(
        until.elementLocated(
          By.xpath(
            "/html/body/div/div[1]/div[1]/div[4]/div[1]/footer/div[1]/div[2]/div/div[1]/div/div[2]"
          )
        ),
        40000
      );

      for (let text of messages) {
        //  add text to text field
        await textElement.sendKeys(text);

        //  click send button
        let clickButtonElement = await this.driver.wait(
          until.elementLocated(
            By.xpath(
              "/html/body/div/div[1]/div[1]/div[4]/div[1]/footer/div[1]/div[2]/div/div[2]/button"
            )
          ),
          40000
        );
        await clickButtonElement.click();
      }

      messages = message.replace("\n", "");
      let source = await this.driver.getPageSource();

      for (let messageText of messages) {
        if (source.includes(messageText)) break;
        else throw Error("Failed to send message!");
      }

      //  wait for messagesto successfully be processed and delivered
      
      await this.driver.sleep(process.env.MODE === "beta" ? 1300 : 1100);
      
      //  the chat body.
      if (process.env.MODE === "beta"){
        try {
          const chatBoxElement = await this.driver.findElement(
            By.xpath("/html/body/div/div[1]/div[1]/div[4]")
          );
    
          //  right click on chat body to bring up context menu
          const tAction = this.driver.actions();
          await tAction
            .move({ duration: 50, origin: chatBoxElement, x: -10, y: -50 })
            .perform();
          await tAction.contextClick().perform();
    
          //  scroll to delete
          for (let i = 0; i < 5; i++) {
            await tAction.sendKeys(Key.ARROW_DOWN).perform();
          }
          await tAction.sendKeys(Key.ENTER).perform();
    
          // confirmation modal continue button
          const continueButton = await this.driver.findElement(
            By.xpath(
              "/html/body/div/div[1]/span[2]/div[1]/div/div/div/div/div/div[3]/div[2]"
            )
          );
    
          await this.driver.wait(until.elementIsEnabled(continueButton));
          await tAction.click(continueButton).perform();
        } catch (error) {
          console.log(error);
        }     
      }
    } catch (error) {
      logger.error(error);
      await Promise.reject(error);
    } finally {
      await this.driver.sleep(250);
      await this.driver.close();
      await this.driver.switchTo().window(baseWindowHandle);
    }
  }

  async sendTextMessage(phone_number, message) {

  }
}

module.exports = AnonMessenger;