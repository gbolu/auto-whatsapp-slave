const util = require("util");
const exec = util.promisify(require("child_process").exec);

const sendMessage = async (message, phone_number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const whatsappMsgBotPath =
        "autoWhatsApp.py";
      const { stdout, stderr } = await exec(
        `python "${whatsappMsgBotPath}" ${phone_number} "${message}"`
      );
      // console.log("stdout:", stdout);
      if (stderr) throw stderr;
      else resolve(true);
    } catch (error) {
      // console.error("stderr:", error);
      reject(error.message);
    }
  });
};

module.exports = sendMessage;