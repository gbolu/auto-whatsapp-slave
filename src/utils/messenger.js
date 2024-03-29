const { Builder, Capabilities, until, By, Key } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
const logger  = require("./logger");
const AppError = require('./appError');

class Messenger {
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

  async validateMessage(message='') {
    return new Promise((resolve, reject) => {
      let messages = message.split('\n');
  
      messages.forEach(text => {
        //  regex used to check for emojis
        const emojiRegexExp =
          /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
    
        //  check for the presence of emojis in text
        let emojiRegexTestResults = emojiRegexExp.exec(text);
        if (emojiRegexTestResults != null) 
        reject(new AppError("Emojis are not allowed."));
      })

      resolve(null);
    })
  }

  async navigateTo(link) {
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

  async sendWhatsAppMessage(phone_number = "", message = "") {
    //  split message by new line character
    let messages = message.split("\n");

    //  remove empty characters from message
    messages = messages.filter((message) => message !== "");

    let baseWindowHandle;

    //  navigate to the whatsapp web webpage in a new tab
    try {
      baseWindowHandle = await this.navigateTo(
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
      
      await this.driver.sleep(process.env.MODE === "beta" ? 2000 : 1700);
      
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
          logger.error(error);
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

  async sendTextMessage(phone_number="", message="") {
    let messages = message.split('\n');

    let baseWindowHandle;
    try {
      baseWindowHandle = await this.navigateTo(
        `https://messages.google.com/web/conversations`
      );

      //  wait for loader to end
      const obstruction = await this.driver.wait(until.elementLocated(
        By.id("loader")
      ), 20000);

      await this.driver.wait(
        until.stalenessOf(obstruction), 20000
      );

      //  find the "Start Chat" Button
      const startChatButton = await this.driver.wait(until.elementLocated(
        By.xpath(
          "/html/body/mw-app/mw-bootstrap/div/main/mw-main-container/div/mw-main-nav/div/mw-fab-link/a/span[1]/div[2]"
      )), 40000);

      await this.driver.wait(until.elementIsVisible(startChatButton), 20000);

      await startChatButton.click();

      //  find phone number text field
      const phoneNumberField = await this.driver.wait(
        until.elementLocated(
          By.xpath(
            "/html/body/mw-app/mw-bootstrap/div/main/mw-main-container/div/mw-new-conversation-container/mw-new-conversation-sub-header/div/div[2]/mw-contact-chips-input/div/mat-chip-list/div/input"
          )
        ),
        40000
      );

      //  type phone number into phoneNumber text field
      await phoneNumberField.sendKeys(phone_number);

      //  grab the element responsible for selecting the number to text
      const sendToNumberButton = await this.driver.wait(
        until.elementLocated(
          By.xpath(
            "/html/body/mw-app/mw-bootstrap/div/main/mw-main-container/div/mw-new-conversation-container/div/mw-contact-selector-button/button"
          )
        ), 20000
      ); 

      //  
      await sendToNumberButton.click();
      
      const textField = await this.driver.wait(until.elementLocated(
        By.xpath("/html/body/mw-app/mw-bootstrap/div/main/mw-main-container/div/mw-conversation-container/div/div[1]/div/mws-message-compose/div/div[2]/div/mws-autosize-textarea/textarea")
      ));

      for (let text of messages) {
        //  add text to text field
        await textField.sendKeys(text);

        //  find the send button
        const sendButton = await this.driver.wait(
          until.elementLocated(
            By.xpath(
              "/html/body/mw-app/mw-bootstrap/div/main/mw-main-container/div/mw-conversation-container/div/div[1]/div/mws-message-compose/div/mws-message-send-button/div/mw-message-send-button/button"
            )
          ), 40000
        );

        //  click send button
        await sendButton.click();
      } 

      //  check that message was sent
      messages = message.replace("\n", "");
      let source = await this.driver.getPageSource();

      for (let messageText of messages) {
        if (!source.includes(messageText)) 
        throw Error("Failed to send message!");
      }

      //  wait for processing to be done
      await this.driver.sleep(2000);

      //  delete the message from the history
      // try {
      //   (
      //     async() => {
      //       //  find the dropdown on the first element in the conversations list box
      //       const conversationBoxDropdownButton = await this.driver.wait(
      //         until.elementLocated(
      //           By.xpath(
      //             "/html/body/mw-app/mw-bootstrap/div/main/mw-main-container/div/mw-main-nav/mws-conversations-list/nav/div[1]/mws-conversation-list-item[1]/a/div[3]/mws-conversation-list-item-menu/button"
      //         )), 2000
      //       );
            
      //       //  click the dropdown button
      //       await conversationBoxDropdownButton.click();

      //       //  find the delete button on the dropdown
      //       const deleteButton = await this.driver.wait(
      //         until.elementLocated(
      //           By.xpath("/html/body/div[6]/div[2]/div/div/div/button[3]")
      //         ), 2000
      //       );
            
      //       //  click delete button
      //       await deleteButton.click();

      //       const confirmDeleteButton = await this.driver.wait(
      //         until.elementLocated(
      //           By.xpath(
      //             "/html/body/div[6]/div[3]/div/mat-dialog-container/mws-dialog/div/mat-dialog-actions/button[2]"
      //           )
      //         ), 2000
      //       );

      //       //  click confirm delete button 
      //       await confirmDeleteButton.click();
      //     }
      //   ) ();  
      // } catch (error) {
      //   logger.warn("Could not delete message box...");
      // }
    } catch (error) {
      logger.error(error);
      await Promise.reject(error);
    } finally {
      await this.driver.sleep(250);
      await this.driver.close();
      await this.driver.switchTo().window(baseWindowHandle);
    }
  }
}

module.exports = Messenger;