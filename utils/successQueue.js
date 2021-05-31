const Queue = require("bull");
require("dotenv").config();
const axios = require("axios").default;
// const url = require('url');

const successQueue = new Queue("whatsapp", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" },
});

successQueue.process((job) => new Promise(async(resolve, reject) => {
    const {id} = job.data;

    let query = `${process.env.SUCCESS_URL}?id=${id}&status=successful`;

    try {
        await axios.get(query);
    } catch (error) {
        console.log(error);
        reject(error);
    }

    resolve(true);
}));

module.exports = successQueue;