import pino from 'pino';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure Pino logger with structured logging
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // Use pino-pretty for development, JSON for production
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: '{levelLabel} - {msg}',
    }
  } : undefined,
  
  // Base fields that will be included in every log
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  
  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Redact sensitive information
  redact: {
    paths: [
      'botToken',
      'token',
      'password',
      'secret',
      'authorization',
      'cookie',
      'initData'
    ],
    remove: true
  }
});

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Helper functions for common logging patterns
export const logError = (error: unknown, context: Record<string, any> = {}) => {
  if (error instanceof Error) {
    logger.error({
      ...context,
      err: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      }
    });
  } else {
    logger.error({ ...context, error: String(error) });
  }
};

// Export default logger
export default logger;

