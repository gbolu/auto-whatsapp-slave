class AppError extends Error {
  constructor(message, statusCode=500, name="") {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    this.name = name  === "" ? super.name : name;

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
