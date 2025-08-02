import { format, createLogger, transports } from "winston";

const { combine, timestamp, prettyPrint, uncolorize } = format;

const prodLogger = () =>
  createLogger({
    level: "info",
    format: combine(uncolorize(), timestamp(), prettyPrint()),
    transports: [
      //
      // - Write all logs with importance level of `error` or higher to `error.log`
      //   (i.e., error, fatal, but not other levels)
      //
      new transports.File({ filename: "error.log", level: "error" }),
      //
      // - Write all logs with importance level of `info` or higher to `combined.log`
      //   (i.e., fatal, error, warn, and info, but not trace)
      //
      new transports.File({ filename: "combined.log" }),
    ],
  });

export default prodLogger;
