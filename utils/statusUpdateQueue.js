const Queue = require("bull");
require("dotenv").config();
const axios = require("axios").default;
const logger = require('./logger');

const statusUpdateQueue = new Queue("statusUpdate", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" },
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
  try {
    logger.error(err);
    if(await statusUpdateQueue.isPaused())
    await statusUpdateQueue.resume();
  } catch (error) {
    console.log(error.message)
  }
});

statusUpdateQueue.on("completed", async (job) => {
  try {
    logger.info(
      `Job with messageID: ${job.data.id} and status: ${job.data.status} completed.`
    ); 
  } catch (error) {
    console.error(error)
  }
});

statusUpdateQueue.on("stalled", async(job) => {
  console.log(`StatusUpdate Queue is stalled on job: ${job.id}`);  
  await job.remove();
  await statusUpdateQueue.removeJobs(job.id);

  if(await statusUpdateQueue.isPaused())
  await statusUpdateQueue.resume();
})

statusUpdateQueue.on("error", (err) => {
  console.log(err)
});

module.exports = statusUpdateQueue;