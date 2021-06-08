const Queue = require('bull');
require('dotenv').config();
const processor = require('./process');

const whatsappQueue = new Queue("whatsapp", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" },
  settings: {
    drainDelay: 10,
    guardInterval: 100,
    stalledInterval: 100,
    maxStalledCount: 0
  }
});

// ncrease the max listeners to get rid of the warning below
// MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 
// 11 global:completed listeners added. Use emitter.setMaxListeners() to increase limit
const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 50;

const logger = require("./logger");

const activeQueues = [
  {
    queue: whatsappQueue,
    processor: processor
  }
];

activeQueues.forEach((handler) => {
  const queue = handler.queue;
  const processor = handler.processor;

  // const failHandler = handler.failHandler || handleFailure;
  // const completedHandler = handler.completedHandler || handleCompleted;

  // here are samples of listener events : "failed","completed","stalled", the other events will be ignored
  queue.on("failed", async(job, err) => {
    try {
      logger.error(err);

      // job.data.attemptsMade ? job.data.attemptsMade += 1 : job.data.attemptsMade = 1

      // if(job.data.attemptsMade === 3){
      //   try {
      //     logger.info(`Sending failed status message...`)
      //     await statusUpdateQueue.add({id: job.data.id, status: "failed"}, {attempts: 3});   
      //     await job.discard();
      //     if(await queue.isPaused())
      //     await queue.resume();
      //     return;
      //   } catch (error) {
      //     throw Error(`An error occurred sending a status message for job with id: ${job.data.id}.`)
      //   }
      // } 

      await queue.removeJobs(job.id);
      
      if(await queue.isPaused())
      await queue.resume();

      // await queue.add(job.data, {delay: 3000});
    } catch (error) {
      console.log(error.message)
    }
    // console.log(err);
  });

  queue.on("completed", async (job) => {
    logger.info(
      `Job: ${job.id} completed.`
    );
    await job.remove();

    if(await queue.isPaused())
    await queue.resume();
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

  queue.on("paused", () => console.log(`Whatsapp Queue has paused.`));
  queue.on("resumed", () => console.log("Whatsapp Queue has resumed."));

  queue.on("error", (err) => {
    console.log(`Something happened!`)
  });

  // queue.on("global:resumed", () => console.log("Whatsapp Queue has resumed"));
  queue.process(processor); // link the correspondant processor/worker

  logger.info(`Processing ${queue.name}...`);
});

module.exports = whatsappQueue;