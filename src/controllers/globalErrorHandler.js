const { Response } = require("http-status-codez");

const responseTemplate = (res, statusCode, message) =>
  res.status(statusCode).json({
    status: `${res.statusCode}`.startsWith("4") ? "fail" : "error",
    code: res.statusCode,
    message,
  });

const sendDevelopmentErrors = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendProductionErrors = (err, res) => {
  if (err.isOperational) {
    return responseTemplate(res, err.statusCode, err.message);
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || Response.HTTP_INTERNAL_SERVER_ERROR;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendDevelopmentErrors(err, res);
  } else if (process.env.NODE_ENV === "production") {
    sendProductionErrors(err, res);
  }
};
