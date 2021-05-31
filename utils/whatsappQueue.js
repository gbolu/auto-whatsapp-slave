const Queue = require('bull');
const sendMessage = require('./sendMessage');
require('dotenv').config();
const axios = require('axios').default;
const successQueue = require('./successQueue');

const whatsappQueue = new Queue("whatsapp", {
  redis: { port: process.env.REDIS_PORT || 6379, host: "127.0.0.1" }
});

whatsappQueue.process(async(job) => 
    new Promise(async(resolve, reject) => {
        console.log('Request recieved...')
        const { id, message, phone_number } = job.data;

        try {
            await sendMessage(message, phone_number);
        } catch (error) {
            console.log(error)
            if(job.attemptsMade === 2){
              whatsappQueue.add(job.data, {attempts: 2});
            }
            reject(error);
        }
        
        try {
          await successQueue.add({id}, {attempts: 3});
        } catch (error) {
            console.log("Error sending status message.");
        }

        resolve(true);
    })
);

module.exports = whatsappQueue;