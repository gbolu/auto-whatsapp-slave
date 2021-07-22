require('dotenv').config();

const Queue = require('bull');
const EventEmitter = require("events");
const logger = require("./logger");

const AutoWhatsApp = require("./autoWhatsApp");
const statusUpdateQueue = require('./statusUpdateQueue');
const args = [
    '--headless',  
    'disable-extensions', 'no-sandbox',
    "proxy-server='direct://'", 'proxy-bypass-list=*',
    'start-maximized', 'disable-gpu', '--disable-dev-shm-usage',
    "window-size=1920,1080",
    'user-agent=User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    'allow-running-insecure-content', 'ignore-certificate-errors', 
]

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

const whatsappQueue = new Queue(`whatsapp-${process.env.BROWSER_TYPE}-${process.env.PORT}`, {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" },
  settings: {
    drainDelay: 500,
    guardInterval: 500,
    maxStalledCount: 0,
    stalledInterval: 0,
  },
  defaultJobOptions: {
    removeOnComplete: true, 
    delay: 0
  }
});

// ncrease the max listeners to get rid of the warning below
// MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 
// 11 global:completed listeners added. Use emitter.setMaxListeners() to increase limit
EventEmitter.defaultMaxListeners = 50;

const activeQueues = [
  {
    queue: whatsappQueue,
  }
];

activeQueues.forEach((handler) => {
  const queue = handler.queue;

  // here are samples of listener events : "failed","completed","stalled", the other events will be ignored
  queue.on("failed", async(job, err) => {
    try {
      logger.error(err);

      //  retry job if error up to 3 attempts
      job.data.attemptsMade ? job.data.attemptsMade += 1 : job.data.attemptsMade = 1

      if(job.data.attemptsMade === 3){
        try {
          logger.info(`Sending failed status message...`)
          await statusUpdateQueue.add({id: job.data.id, status: "failed"}, {attempts: 3});   
          await job.discard();

          if(await queue.isPaused())
          await queue.resume();
        } catch (error) {
          throw Error(`An error occurred sending a status message for job with id: ${job.data.id}.`)
        }
      } else {
        await job.remove();

        if(await queue.isPaused())
        await queue.resume();

        await queue.add(job.data, {lifo: true});
      }

    } catch (error) {
      logger.error(error.message)
    }
  });

  queue.on("completed", async (job) => {
    try {
      logger.info(
        `Job: ${job.id} completed.`
      );
      await job.remove();
      await queue.removeJobs(job.id)
  
      if(await queue.isPaused())
      await queue.resume();  
    } catch (error) {
      logger.error(error)
    }
  });

  queue.on("stalled", async(job) => {
    logger.info(`Whatsapp Queue is stalled on job: ${job.id}`);
    
    if(!await job.isActive())
    await job.remove();

    if(await queue.isPaused())
    await queue.resume();
  })

  queue.on("waiting", async (job) => {
    logger.info("Waiting at the moment on job: " + job);
    if(await queue.isPaused())
    await queue.resume();
  });

  queue.on("active", async (job) => {
    logger.info(`Job: ${job.id} has started.`);
    await queue.pause();
  });

  queue.on("empty", async () => {
    // logger.info(`Starting timer to keep WhatsApp alive...`);
    // KeepAliveTimer.start();
  });

  queue.on("paused", () => logger.info(`Whatsapp Queue has paused.`));
  queue.on("resumed", async () => {
    logger.info("Whatsapp Queue has resumed.")
    // await emptyHandler();
  });

  queue.on("error", (err) => {
    logger.info(err)
  });

  // link the correspondant processor/worker
  queue.process(1, function(job) {
    const { id, message, phone_number } = job.data;

    return auto.sendMessage(phone_number, message)
      .then(() => {
        logger.info('Job done!');
        return statusUpdateQueue.add({id, status: "successful"}, {attempts: 3, removeOnComplete: true})
        .then(() => {
          return Promise.resolve();
        })
        .catch(err => {
          throw new Error(err);
        })
      })
      .catch(err => {
        throw new Error(err);
      });
}); 

  logger.info(`Processing ${queue.name}-${process.env.BROWSER_TYPE}...`);
});

module.exports = whatsappQueue;