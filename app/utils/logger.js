const { createLogger, format, transports } = require('winston');
const winstonError = require('winston-error');

const { printf } = format;

const logger = createLogger({
  level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info',
});

winstonError(logger);

const message = printf(info => {
  if (info.level === 'error') {
    // eslint-disable-next-line
    console.error(info.error.stack);
    return info.error.message;
  }
  return info.message;
});

logger.add(
  new transports.Console({
    format: message,
    level: 'info',
  }),
);

module.exports = logger;
