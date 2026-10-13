import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class ParametersCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const param = new ssm.StringParameter(this, 'Parameter', {
      allowedPattern: '.*',
      description: 'A LocalStack test parameter',
      parameterName: '/localstack/parameter',
      stringValue: JSON.stringify({message: 'You have successfully retrieved a parameter from SSM'}),
      tier: ssm.ParameterTier.ADVANCED,
    });

    const parametersFunction = new NodejsFunction(this, 'parametersFunction', {
      runtime: Runtime.NODEJS_22_X,
      entry: '../parameters-lambda/index.ts',
      projectRoot: '../parameters-lambda',
      depsLockFilePath: '../parameters-lambda/package-lock.json',
      handler: 'handler',
    });
    param.grantRead(parametersFunction);

    new cdk.CfnOutput(this, 'ParametersFunction', {
      value: parametersFunction.functionName,
    });
  }
}
