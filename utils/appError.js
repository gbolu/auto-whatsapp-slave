class AppError extends Error {
  constructor(message, name) {
    super(message);
    
    this.isOperational = true;
    this.name = name;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
