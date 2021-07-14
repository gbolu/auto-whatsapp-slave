const { Builder, Capabilities, until, By } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');

class AutoWhatsapp {
    /**
     * @param {Array<String>} chrome_options_args
     */
    constructor(chrome_options_args){
        this.init(chrome_options_args);
    }

    init(args){
        let newChromeOptions = new chrome.Options().setChromeBinaryPath(process.env.CHROME_BINARY);
        
        for (let arg of args)
        {
            newChromeOptions.addArguments(arg);
        }

        this.driver = new Builder()
            .forBrowser('chrome')
            .withCapabilities(Capabilities.chrome())
            .setChromeOptions(newChromeOptions)
            .build()
    }

    async sendMessage(phone_number='2348186511634', message='') {
        //  split message by new line character
        let messages = message.split('\n');
        console.log("Reached!")

        //  remove empty characters from message
        messages = messages.filter(message => message !== '');

        //  navigate to the whatsapp web webpage in a new tab
        try {
            await this.driver.executeScript(`window.open('https://web.whatsapp.com/send?phone=${phone_number}')`);
            let windowHandles = await this.driver.getAllWindowHandles();
            let baseWindowHandle = await this.driver.getWindowHandle();
            let targetWindowHandle = windowHandles.filter(windowHandle => windowHandle != baseWindowHandle)[0];
            await this.driver.switchTo().window(targetWindowHandle);

            //  select text field used to input messages
            let textElement = await this.driver.wait(until.elementLocated(By.xpath('/html/body/div/div[1]/div[1]/div[4]/div[1]/footer/div[1]/div[2]/div/div[1]/div/div[2]')), 20000)  

            for(let text of messages)
            {
                //  add text to text field
                await textElement.sendKeys(text);

                //  click send button
                let clickButtonElement = await this.driver.wait(until.elementLocated(By.xpath('/html/body/div/div[1]/div[1]/div[4]/div[1]/footer/div[1]/div[2]/div/div[2]/button')), 20000);
                await clickButtonElement.click();
            }

            messages = message.replace('\n', '')
            let source = await this.driver.getPageSource();

            for(let messageText of messages)
            {
                if (source.includes(messageText))
                break

                else
                throw Error("Failed to send message!");
            }

            try {
                await this.driver.close();
                await this.driver.switchTo().window(baseWindowHandle);
            } catch (error) {
                console.log(error);
                console.log((await this.driver.getPageSource()))
            }
        } catch (error) {
            console.log(error);
            await Promise.reject(error);
        }
        
        await Promise.resolve();
    }
}

module.exports = AutoWhatsapp;