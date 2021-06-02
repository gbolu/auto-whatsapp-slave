const Queue = require('bull');
const sendMessage = require('./sendMessage');
require('dotenv').config();
const axios = require('axios').default;
const successQueue = require('./successQueue');

const whatsappQueue = new Queue("whatsapp", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" }
});

whatsappQueue.process(async (job) => {
    console.log('Request recieved');
    console.log((await job.isActive()))
    const { id, message, phone_number } = job.data;

    try {
        await sendMessage(message, phone_number);
    } catch (error) {
        console.log(error)
        if(job.attemptsMade === 2){
          await whatsappQueue.add(job.data, {attempts: 2});
        }
        return Promise.reject(error);
    }
    
    try {
      await successQueue.add({id}, {attempts: 3});
    } catch (error) {
        console.log("Error sending status message.");
    }
    return Promise.resolve(true);
  }
);

module.exports = whatsappQueue;