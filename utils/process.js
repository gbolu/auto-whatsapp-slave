const sendMessage = require("./sendMessage");
const successQueue = require('./successQueue');

const processor = async job => {
  const { id, message, phone_number } = job.data;

  try {
    await sendMessage(message, phone_number);
  } catch (error) {
    return Promise.reject(error);
  }

  try {
    await successQueue.add({id}, {attempts: 3});
    console.log("Sent success message!")
  } catch (error) {
    console.log("Error sending status message.");
  }

  return Promise.resolve();
};

module.exports = processor;