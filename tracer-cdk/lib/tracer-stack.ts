import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
export class TracerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
   super(scope, id, props);

    const tracerFunction = new NodejsFunction(this, 'tracerFunction', {
      entry: '../tracer-lambda/index.ts',
      handler: 'handler',
      tracing: Tracing.ACTIVE
    });
    
    new cdk.CfnOutput(this, 'TracerFunction', {
      value: tracerFunction.functionName,
    });
  }
}
