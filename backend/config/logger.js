const winston = require('winston');

const levels = {
  error: 0,
  warn: 1,
  info: 2
};

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack || ''}`;
  })
);

const logger = winston.createLogger({
  levels,
  level: 'info',
  format,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({
          colors: {
            error: 'red',
            warn: 'yellow',
            info: 'green'
          }
        }),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${message} ${stack || ''}`;
        })
      )
    })
  ],
  exitOnError: false
});

module.exports = logger;