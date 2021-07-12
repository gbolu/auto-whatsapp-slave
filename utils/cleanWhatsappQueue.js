const whatsappQueue = require("./whatsappQueue");

const cleanWhatsappQueue = async () => {
  await Promise.all([whatsappQueue.empty(), 
  whatsappQueue.clean(10, "active"), 
  whatsappQueue.clean(10, "completed"),
  whatsappQueue.clean(10, "wait"), 
  whatsappQueue.clean(10, "failed"), 
  whatsappQueue.clean(10, "delayed"), 
  whatsappQueue.clean(10, "paused")]);
};

module.exports = cleanWhatsappQueue;