const sendMessage = require("./sendMessage");
const statusUpdateQueue = require('./statusUpdateQueue');

const processor = async job => {
  const { id, message, phone_number } = job.data;

  try {
    await sendMessage(message, phone_number);
  } catch (error) {
    return Promise.reject(error);
  }

  try {
    await statusUpdateQueue.add({id, status: "successful"}, {attempts: 3});
    console.log("Sent success message!")
  } catch (error) {
    console.log("Error sending status message.");
  }

  return Promise.resolve();
};

module.exports = processor;