import { format, createLogger, transports } from "winston";

const { combine, timestamp, colorize } = format;

const formatLog = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const devLogger = () =>
  createLogger({
    level: "debug",
    format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), formatLog),
    transports: [new transports.Console()],
  });

export default devLogger;
