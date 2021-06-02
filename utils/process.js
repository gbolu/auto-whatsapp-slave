const sendMessage = require("./sendMessage");

const processor = async (val = 1, job) => {
  console.log("Request recieved" + job.id);
  job.lockKey();
  await job.takeLock();
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
  job.releaseLock();
  return Promise.resolve(true);
};

module.exports = processor;