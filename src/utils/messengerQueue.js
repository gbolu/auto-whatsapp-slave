require('dotenv').config();

const Queue = require('bull');
const EventEmitter = require("events");
const logger = require("./logger");

const statusUpdateQueue = require('./statusUpdateQueue');
const messengerProcessor = require('./messengerQueueProcessor');

const messengerQueue = new Queue(`messenger-${process.env.BROWSER_TYPE}-${process.env.PORT}`, {
  redis: { port: process.env.REDIS_PORT || 6379, host: process.env.REDIS_HOST },
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
    queue: messengerQueue,
  }
];

activeQueues.forEach((handler) => {
  const queue = handler.queue;

  // here are samples of listener events : "failed","completed","stalled", the other events will be ignored
  queue.on("failed", async(job, err) => {
    try {
      logger.error(err);

      if(err.name !== "ValidationError"){
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
    logger.info(`${messengerQueue.name} Queue is stalled on job: ${job.id}`);
    
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

  queue.on("paused", () => logger.info(`${messengerQueue.name} Queue has paused.`));
  queue.on("resumed", async () => {
    logger.info(`${messengerQueue.name} Queue has resumed.`)
    // await emptyHandler();
  });

  queue.on("error", (err) => {
    logger.info(err)
  });

  // link the correspondant processor/worker
  queue.process(1, messengerProcessor); 

  logger.info(`Processing ${queue.name}...`);
});

module.exports = messengerQueue;