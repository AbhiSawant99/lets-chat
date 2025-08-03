import devLogger from "./dev-logger";
import prodLogger from "./prod-logger";
import { Logger } from "winston";

let logger: Logger;

if (process.env.NODE_ENV === "production") {
  logger = prodLogger();
} else {
  logger = devLogger();
}

export { logger };
