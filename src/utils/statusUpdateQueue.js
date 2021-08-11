const Queue = require("bull");
require("dotenv").config();
const axios = require("axios").default;
const logger = require('./logger');

const statusUpdateQueue = new Queue("statusUpdate", {
  redis: { port: process.env.REDIS_PORT || 6379, host: process.env.REDIS_HOST },
});

statusUpdateQueue.process(3, (job) => new Promise(async(resolve, reject) => {
    const {id, status} = job.data;

    let query = `${process.env.SUCCESS_URL}?id=${id}&status=${status}`;

    try {
      await axios.get(query);
      return resolve(true);
    } catch (error) {
      return reject(error);
    }
}));

statusUpdateQueue.on("failed", async(job, err) => {
  logger.error(err);
});

statusUpdateQueue.on("completed", (job) => {
  logger.info(
    `${statusUpdateQueue.name} Job with messageID: ${job.data.id} and status: ${job.data.status} completed.`
  ); 
});

statusUpdateQueue.on("stalled", async(job) => {
  logger.info(`${statusUpdateQueue.name} Queue is stalled on job: ${job.id}`);  
  await job.remove();
  await statusUpdateQueue.removeJobs(job.id);

  if(await statusUpdateQueue.isPaused())
  await statusUpdateQueue.resume();
})

statusUpdateQueue.on("error", (err) => {
  logger.error(err)
});

module.exports = statusUpdateQueue;