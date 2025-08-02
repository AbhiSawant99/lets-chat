import devLogger from "./devLogger";
import prodLogger from "./prodLogger";
import { Logger } from "winston";

let logger: Logger;

if (process.env.NODE_ENV === "production") {
  logger = prodLogger();
} else {
  logger = devLogger();
}

export { logger };
