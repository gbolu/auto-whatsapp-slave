const Queue = require("bull");
require("dotenv").config();
const axios = require("axios").default;
// const url = require('url');

const statusUpdateQueue = new Queue("whatsapp", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" },
});

statusUpdateQueue.process((job) => new Promise(async(resolve, reject) => {
    const {id, status} = job.data;

    let query = `${process.env.SUCCESS_URL}?id=${id}&status=${status}`;

    try {
        await axios.get(query);
    } catch (error) {
        reject(error);
    }

    resolve(true);
}));

module.exports = statusUpdateQueue;