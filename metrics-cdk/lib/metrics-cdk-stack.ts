import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class MetricsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const metricsFunction = new NodejsFunction(this, 'metricsFunction', {
      runtime: Runtime.NODEJS_22_X,
      entry: '../metrics-lambda/index.ts',
      projectRoot: '../metrics-lambda',
      depsLockFilePath: '../metrics-lambda/package-lock.json',
      handler: 'handler',
      environment: {
        POWERTOOLS_SERVICE_NAME: 'helloWorld',
        POWERTOOLS_METRICS_NAMESPACE: 'localstackDemo',
      },
    });

    new cdk.CfnOutput(this, 'MetricsFunction', {
      value: metricsFunction.functionName,
    });
  }
}
