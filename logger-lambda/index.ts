
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';

const logger = new Logger();

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  const importantVariable = 'important';
  // this is the default but we're setting it here for example purposes
  // Accepted values are DEBUG, INFO, WARN, ERROR, CRITICAL, SILENT
  logger.setLogLevel('INFO')

  // You can set a log message and pass in additional keys you want to be logged
  logger.info('This is a structured log message',
    { data: importantVariable }
  );
};

export const handler = middy(lambdaHandler).use(
  injectLambdaContext(logger, { logEvent: true })
);