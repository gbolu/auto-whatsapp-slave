const Messenger = require("./messenger");

let args = [
  "disable-extensions",
  "no-sandbox",
  "proxy-server='direct://'",
  "proxy-bypass-list=*",
  "start-maximized",
  "disable-gpu",
  "--disable-dev-shm-usage",
  "window-size=1920,1080",
  "user-agent=User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36",
  "allow-running-insecure-content",
  "ignore-certificate-errors",
];
if (process.env.NODE_ENV === "production") {
  args = ["--headless", ...args];
}

let anonMessenger;

if (process.env.BROWSER_TYPE === "chrome") {
  anonMessenger = new Messenger(args, "chrome", process.env.CHROME_DATA_DIR);
  (async () => {
    await anonMessenger.chromeInit();
  })();
}

if (process.env.BROWSER_TYPE === "edge") {
  anonMessenger = new Messenger(args, "MicrosoftEdge", process.env.EDGE_DATA_DIR);
  (async () => {
    await anonMessenger.edgeInit();
  })();
}

if (process.env.BROWSER_TYPE === "firefox") {
  anonMessenger = new Messenger([], "firefox", process.env.FIREFOX_DATA_DIR);
  (async () => {
    await anonMessenger.firefoxInit();
  })();
}

module.exports = anonMessenger;
