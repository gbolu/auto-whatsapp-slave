const Queue = require('bull');
const cleanQueue = async (queue = new Queue) => {
  await Promise.all([queue.empty(), 
  queue.clean(10, "active"), 
  queue.clean(10, "completed"),
  queue.clean(10, "wait"), 
  queue.clean(10, "failed"), 
  queue.clean(10, "delayed"), 
  queue.clean(10, "paused")]);
};

module.exports = cleanQueue;
