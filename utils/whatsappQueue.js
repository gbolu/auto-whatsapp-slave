const Queue = require('bull');
const sendMessage = require('./sendMessage');
require('dotenv').config();
const axios = require('axios').default;
const successQueue = require('./successQueue');
const processor = require('./process');

const whatsappQueue = new Queue("whatsapp", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" },
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: false,
  },
  settings: {
    drainDelay: 10,
    lockRenewTime: 10,
    retryProcessDelay: 100,
    guardInterval: 100
  }
});

// ncrease the max listeners to get rid of the warning below
// MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 
// 11 global:completed listeners added. Use emitter.setMaxListeners() to increase limit
const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 50;

const logger = require("./logger");

const handleFailure = (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    logger.info(
      `Job failures above threshold in ${job.queue.name} for: ${JSON.stringify(
        job.data
      )}`,
      err
    );
    job.remove();
    return null;
  }
  logger.info(
    `Job in ${job.queue.name} failed for: ${JSON.stringify(job.data)} with ${
      err.message
    }. ${job.opts.attempts - job.attemptsMade} attempts left`
  );
};

const handleCompleted = job => {
  logger.info(
    `Job in ${job.queue.name} completed for: ${JSON.stringify(job.data)}`
  );
  job.remove();
};

const handleStalled = job => {
  logger.info(
    `Job in ${job.queue.name} stalled for: ${JSON.stringify(job.data)}`
  );
};

const activeQueues = [
  {
    queue: whatsappQueue,
    processor: processor
  }
];

activeQueues.forEach((handler) => {
  const queue = handler.queue;
  const processor = handler.processor;

  const failHandler = handler.failHandler || handleFailure;
  const completedHandler = handler.completedHandler || handleCompleted;

  // here are samples of listener events : "failed","completed","stalled", the other events will be ignored
  queue.on("failed", failHandler);
  queue.on("completed", completedHandler);
  queue.on("error", (err) => {logger.error(err.message)});
  queue.on("waiting", (job) => {
    console.log("Waiting at the moment on job: " + job);
  });
  queue.on("global:resumed", () => console.log("Whatsapp Queue has resumed"));
  queue.process(processor); // link the correspondant processor/worker

  logger.info(`Processing ${queue.name}...`);
});

module.exports = whatsappQueue;