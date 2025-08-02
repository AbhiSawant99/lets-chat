export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

// todo: check this later
// export class AppError extends Error {
//   statusCode: number;
//   isOperational: boolean;

//   constructor(message: string, statusCode = 500) {
//     super(message);

//     this.statusCode = statusCode;
//     this.isOperational = true;

//     // Ensure correct prototype chain
//     Object.setPrototypeOf(this, new.target.prototype);

//     // Optional: capture stack trace
//     Error.captureStackTrace(this, this.constructor);
//   }
// }
