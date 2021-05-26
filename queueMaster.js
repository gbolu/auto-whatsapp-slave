const Queue = require('bull');
const sendMessage = require('./utils/sendMessage');
require('dotenv').config();
const axios = require('axios').default;

const whatsappQueue = new Queue("whatsapp", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" },
  limiter: {},
});

whatsappQueue.process(async(job) => {
    return new Promise((resolve, reject) => {
        const { id, message, phone_number } = job.data;

        try {
            await sendMessage(message, phone_number);
            await axios.get(process.env.SUCCESS_URL, {
                data: {
                    id, status: 'success'
                }
            });
            resolve(true);
        } catch (error) {
            reject(error);
        }
    })
});

module.exports = whatsappQueue;