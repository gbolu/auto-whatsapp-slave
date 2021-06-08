const util = require("util");
const exec = util.promisify(require("child_process").exec);

const sendMessage = async (message, phone_number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const whatsappMsgBotPath =
        "autoWhatsApp.py";
      
      //  child process to handle autoWhatsapp execution
      const execCommand = await exec(
        `python3 "${whatsappMsgBotPath}" ${phone_number} "${message}"`
        // `dir`
      );
      
      const {stdout, stderr} = execCommand;
      if(stderr)
      throw stderr;

      return resolve();
    } catch (error) {
      return reject(error.message);
    }
  });
};

module.exports = sendMessage;
