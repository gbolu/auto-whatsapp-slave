require('dotenv').config();

const Queue = require('bull');
const EventEmitter = require("events");
const logger = require("./logger");

const AutoWhatsApp = require("./autoWhatsApp");
const statusUpdateQueue = require('./statusUpdateQueue');
const args = [
    // '--headless',
    'disable-extensions', 'no-sandbox',
    "proxy-server='direct://'", 'proxy-bypass-list=*',
    'start-maximized', 'disable-gpu',
    "window-size=1920,1080",
    'user-agent=User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    'allow-running-insecure-content', 'ignore-certificate-errors', 
    `user-data-dir=${process.env.USER_DATA_DIR}`
]

const auto = new AutoWhatsApp(args);
(async () => {
  await auto.driver.get("https://www.google.com")
})();

const whatsappQueue = new Queue("whatsapp", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" },
  settings: {
    maxStalledCount: 0,
    stalledInterval: 0,
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
          return;
        } catch (error) {
          throw Error(`An error occurred sending a status message for job with id: ${job.data.id}.`)
        }
      } else {
        await job.remove();
        if(await queue.isPaused())
        await queue.resume();

        if(job.data.type !== "keep_alive"){
          await queue.add(job.data, {delay: 10000});
        }
      }

    } catch (error) {
      console.log(error.message)
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
      console.error(error)
    }
  });

  queue.on("stalled", async(job) => {
    console.log(`Whatsapp Queue is stalled on job: ${job.id}`);
    
    if(!await job.isActive())
    await job.remove();

    if(await queue.isPaused())
    await queue.resume();
  })

  queue.on("waiting", async (job) => {
    console.log("Waiting at the moment on job: " + job);
    if(await queue.isPaused())
    await queue.resume();
  });

  queue.on("active", async (job) => {
    console.log(`Job: ${job.id} has started.`);
    await queue.pause();
  });

  queue.on("empty", async () => {
    // logger.info(`Starting timer to keep WhatsApp alive...`);
    // KeepAliveTimer.start();
  });

  queue.on("paused", () => console.log(`Whatsapp Queue has paused.`));
  queue.on("resumed", async () => {
    console.log("Whatsapp Queue has resumed.")
    // await emptyHandler();
  });

  queue.on("error", (err) => {
    console.log(err)
  });

  // link the correspondant processor/worker
  queue.process(function(job) {
    const { id, message, phone_number } = job.data;

    return auto.sendMessage(phone_number, message)
      .then(() => {
        console.log('Job done!');
        return statusUpdateQueue.add(job.data, {attempts: 3})
        .then(() => {
          console.log('Status updated!');
          return;
        })
        .catch(err => {throw err;})
      })
      .catch(err => console.log(err));
}); 

  logger.info(`Processing ${queue.name}...`);
});

module.exports = whatsappQueue;