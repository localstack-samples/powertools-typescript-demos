## Powertools for AWS Lambda (TypeScript) in LocalStack

[Powertools for AWS Lambda](https://docs.powertools.aws.dev/lambda/typescript/latest/) provide implementations of best practices for Lambda function development that are easy to integrate into your existing Lambda functions.

This examples repository provides basic examples of the TypeScript implementation Powertools that can be run and tested in [LocalStack for AWS](https://localstack.cloud). The good news is that Powertools (including the logger, metrics, parameters, tracer and idempotency shown here) can be used "out of the box" in LocalStack for AWS.

### Setup, Deployment and Testing the Examples

The easiest way to test these examples is to use the provided Makefile. Start by installing the necessary dependencies:

```bash
make install
```

Ensure that you have LocalStack for AWS running on your machine and then run the deploy command for the example you wish to run. For example:

```bash
make deploy-idempotency
```

Once the deployment is finished, invoke the Lambda function. For example:

```bash
make invoke-idempotency
```

To deploy every example and check that each one works, run:

```bash
make deploy
make test
```

`make test` runs `test.sh`, which invokes each function and checks the result:

- **logger:** the function writes a structured JSON log line with the Lambda context and logs the incoming event.
- **metrics:** the function writes the `successfulRun` metric in Embedded Metric Format. LocalStack does not turn EMF log records into CloudWatch metrics, so the test checks the record in the function logs.
- **parameters:** the function reads the JSON parameter `/localstack/parameter` from SSM and returns it parsed.
- **tracer:** the function stores an item in DynamoDB through the instrumented client.
- **idempotency:** a repeated request returns the stored result instead of creating a second payment.

Pass `EXAMPLES` to test a subset, for example `make test EXAMPLES="logger tracer"`.

### Manually Setup, Deployment and Testing the Examples

The examples are set up to enable easy deployment and testing of the particular Powertool library you wish to use. Each example has a lambda folder containing the example Lambda and a CDK folder containing the CDK script needed to deploy the example. You will need the AWS CLI, AWS CDK CLI, LocalStack, and [`lstk`](https://docs.localstack.cloud/aws/developer-tools/running-localstack/lstk/) installed.

You'll need to run npm install within the directories for the example you wish to run. For instance:

```bash
cd tracer-lambda
npm install
cd ../tracer-cdk
npm install
```

Next, you can bootstrap and deploy using `lstk`'s CDK wrapper from within the CDK folder for the example you wish to deploy to LocalStack.

```bash
lstk cdk bootstrap
lstk cdk deploy
```

The output will include the names of the deployed functions, which you can test using `lstk aws` (replacing `TracerStack-tracerFunction` with the outputted function name):

```bash
lstk aws lambda invoke --function-name TracerStack-tracerFunction output.txt
```

Note that the idempotency example does require passing a JSON payload containing a `productId` and `user` (see the Makefile for an example on how to call this function manually).
