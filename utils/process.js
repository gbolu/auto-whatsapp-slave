const sendMessage = require("./sendMessage");

const processor = async (job) => {
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
  await job.releaseLock();
  return Promise.resolve(true);
};

module.exports = processor;