const AutoWhatsApp = require("./autoWhatsApp");
const statusUpdateQueue = require('./statusUpdateQueue');
const logger = require('./logger');

let args = [
    'disable-extensions', 'no-sandbox',
    "proxy-server='direct://'", 'proxy-bypass-list=*',
    'start-maximized', 'disable-gpu', '--disable-dev-shm-usage',
    "window-size=1920,1080",
    'user-agent=User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    'allow-running-insecure-content', 'ignore-certificate-errors', 
]
if (process.env.NODE_ENV === "production"){
  args = ['--headless', ...args]
}  

let auto;

if(process.env.BROWSER_TYPE === 'chrome'){
  auto = new AutoWhatsApp(args, 'chrome', process.env.CHROME_DATA_DIR);
  (async () => {
    await auto.chromeInit();
  })();
}

if(process.env.BROWSER_TYPE === 'edge'){
  auto = new AutoWhatsApp(args, 'MicrosoftEdge', process.env.EDGE_DATA_DIR);
  (async () => {
    await auto.edgeInit();
  })();
}

if(process.env.BROWSER_TYPE === 'firefox'){
  auto = new AutoWhatsApp([], 'firefox', process.env.FIREFOX_DATA_DIR);
  (async () => {
    await auto.firefoxInit();
  })();
}

const autoWhatsAppProcessor = function(job, done) {
  const { id, message, phone_number } = job.data;

  return auto.
    validateMessage(message)
    .then(_ => auto.sendMessage(phone_number, message))
    .then(() => {
      logger.info('Job done!');
      return statusUpdateQueue.add({id, status: "successful"}, {attempts: 3, removeOnComplete: true})
    })
    .then(() => {
      done(null);
    })
    .catch(err => {
      done(err);
    });
}

module.exports = autoWhatsAppProcessor;