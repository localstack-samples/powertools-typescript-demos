import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
export class TracerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
   super(scope, id, props);

    const itemsTable = new Table(this, 'itemsTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const tracerFunction = new NodejsFunction(this, 'tracerFunction', {
      entry: '../tracer-lambda/index.ts',
      handler: 'handler',
      tracing: Tracing.ACTIVE,
      environment: {
        ITEMS_TABLE_NAME: itemsTable.tableName,
      },
      bundling: {
        format: OutputFormat.ESM,
        minify: true,
        esbuildArgs: {
          "--tree-shaking": "true",
        },
        banner: 
        "import { createRequire } from 'module';const require = createRequire(import.meta.url);", 
    },
    });

    itemsTable.grantReadWriteData(tracerFunction);
    
    new cdk.CfnOutput(this, 'TracerFunction', {
      value: tracerFunction.functionName,
    });
  }
}
