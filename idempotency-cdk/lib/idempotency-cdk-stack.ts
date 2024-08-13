import * as cdk from 'aws-cdk-lib';
import { Stack, type StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';

export class IdempotencyStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const idempotencyTable = new Table(this, 'idempotencyTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      timeToLiveAttribute: 'expiration',
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const paymentTable = new Table(this, 'paymentTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    const fnHandler = new NodejsFunction(this, 'helloWorldFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: '../idempotency-lambda/index.ts',
      environment: {
        IDEMPOTENCY_TABLE_NAME: idempotencyTable.tableName,
        PAYMENT_TABLE_NAME: paymentTable.tableName,
      },
    });
    paymentTable.grantReadWriteData(fnHandler);
    idempotencyTable.grantReadWriteData(fnHandler);
  }
}