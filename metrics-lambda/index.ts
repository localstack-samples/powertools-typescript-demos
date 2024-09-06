import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';

const metrics = new Metrics({
  namespace: 'localstackDemo',
  serviceName: 'demoService',
});

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulRun', MetricUnit.Count, 1);
};

export const handler = middy(lambdaHandler).use(logMetrics(metrics));