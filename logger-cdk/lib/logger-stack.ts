import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
export class LoggerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
   super(scope, id, props);
   const loggerFunction = new NodejsFunction(this, 'loggerFunction', {
      runtime: Runtime.NODEJS_22_X,
      entry: '../logger-lambda/index.ts',
      projectRoot: '../logger-lambda',
      depsLockFilePath: '../logger-lambda/package-lock.json',
      handler: 'handler',
      environment: {
        POWERTOOLS_SERVICE_NAME: 'helloWorld',
        LOG_LEVEL: 'INFO',
      },
      logGroup: new LogGroup(this, 'loggerLogGroup', {
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    new cdk.CfnOutput(this, 'LoggerFunction', {
      value: loggerFunction.functionName,
    });
  }
}
