#!/bin/bash
# Invoke each deployed example and check the Powertools utility did its job.
# Usage: ./test.sh [logger] [metrics] [parameters] [tracer] [idempotency] (default: all)
set -euo pipefail

EXAMPLES=${*:-logger metrics parameters tracer idempotency}
RUN_ID=$(date +%s)
OUT=$(mktemp)
trap 'rm -f "$OUT"' EXIT

fail() {
  echo "Test failed: $*"
  exit 1
}

# function_name <stack> <output key>
function_name() {
  lstk aws cloudformation describe-stacks --stack-name "$1" \
    --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" --output text
}

# invoke <function> <payload>: writes the response to $OUT and the log tail to $LOGS
invoke() {
  local result
  result=$(lstk aws lambda invoke --function-name "$1" --payload "$2" \
    --cli-binary-format raw-in-base64-out --log-type Tail --output json "$OUT")
  LOGS=$(echo "$result" | jq -r '.LogResult // ""' | base64 --decode)
  if [ "$(echo "$result" | jq -r '.FunctionError // ""')" != "" ]; then
    echo "$LOGS"
    fail "$1 returned an error: $(cat "$OUT")"
  fi
}

# env_var <function> <name>
env_var() {
  lstk aws lambda get-function-configuration --function-name "$1" \
    --query "Environment.Variables.$2" --output text
}

test_logger() {
  local fn line
  fn=$(function_name LoggerStack LoggerFunction)
  invoke "$fn" "{\"run\": \"$RUN_ID\"}"
  line=$(echo "$LOGS" | grep '"This is a structured log message"' || true)
  [ -n "$line" ] || { echo "$LOGS"; fail "logger did not write the structured log message"; }
  echo "$line" | jq -e '.level == "INFO" and .data == "important" and .service == "helloWorld" and .function_name != null' > /dev/null \
    || fail "log line is missing the expected keys: $line"
  echo "$LOGS" | grep '"Lambda invocation event"' | grep -q "\"run\":\"$RUN_ID\"" \
    || { echo "$LOGS"; fail "logger did not log the invocation event"; }
  echo "PASS: logger writes structured JSON with the Lambda context and logs the event"
}

test_metrics() {
  local fn line
  fn=$(function_name MetricsCdkStack MetricsFunction)
  invoke "$fn" '{}'
  line=$(echo "$LOGS" | grep '"_aws"' || true)
  [ -n "$line" ] || { echo "$LOGS"; fail "metrics did not write an EMF record"; }
  echo "$line" | jq -e '._aws.CloudWatchMetrics[0].Namespace == "localstackDemo" and .successfulRun == 1 and .service == "demoService"' > /dev/null \
    || fail "EMF record does not hold the successfulRun metric: $line"
  # LocalStack does not turn EMF log records into CloudWatch metrics, so check the record itself
  echo "PASS: metrics writes the successfulRun metric in EMF"
}

test_parameters() {
  local fn
  fn=$(function_name ParametersCdkStack ParametersFunction)
  invoke "$fn" '{}'
  jq -e '.message == "You have successfully retrieved a parameter from SSM"' "$OUT" > /dev/null \
    || fail "parameters returned $(cat "$OUT")"
  echo "PASS: parameters reads and parses the JSON parameter from SSM"
}

test_tracer() {
  local fn table name item_id stored
  fn=$(function_name TracerStack TracerFunction)
  table=$(env_var "$fn" ITEMS_TABLE_NAME)
  name="item from CI $RUN_ID"
  invoke "$fn" "{\"name\": \"$name\"}"
  jq -e '.statusCode == 200' "$OUT" > /dev/null || fail "tracer returned $(cat "$OUT")"
  item_id=$(jq -r '.body | fromjson | .itemId' "$OUT")
  stored=$(lstk aws dynamodb get-item --table-name "$table" --key "{\"id\": {\"S\": \"$item_id\"}}" \
    --query Item.name.S --output text)
  [ "$stored" = "$name" ] || fail "item $item_id in $table has name '$stored'"
  echo "PASS: tracer stores the item through the instrumented DynamoDB client"
}

test_idempotency() {
  local fn table first second other count
  fn=$(function_name IdempotencyStack IdempotencyFunction)
  table=$(env_var "$fn" PAYMENT_TABLE_NAME)

  invoke "$fn" "{\"productId\": \"ci-$RUN_ID\", \"user\": \"2\"}"
  first=$(jq -r '.body | fromjson | .paymentId' "$OUT")
  invoke "$fn" "{\"productId\": \"ci-$RUN_ID\", \"user\": \"2\"}"
  second=$(jq -r '.body | fromjson | .paymentId' "$OUT")
  invoke "$fn" "{\"productId\": \"ci-$RUN_ID-other\", \"user\": \"2\"}"
  other=$(jq -r '.body | fromjson | .paymentId' "$OUT")

  [ -n "$first" ] && [ "$first" != "null" ] || fail "idempotency returned no paymentId"
  [ "$first" = "$second" ] || fail "repeating the request created a new payment ($first, then $second)"
  [ "$other" != "$first" ] || fail "a different product reused payment $first"
  count=$(lstk aws dynamodb scan --table-name "$table" \
    --filter-expression 'productid = :p' --expression-attribute-values "{\":p\": {\"S\": \"ci-$RUN_ID\"}}" \
    --query Count --output text)
  [ "$count" = "1" ] || fail "expected 1 payment for product ci-$RUN_ID, found $count"
  echo "PASS: idempotency returns the stored result for a repeated request and stores one payment"
}

for example in $EXAMPLES; do
  "test_$example"
done
echo "Test passed: $EXAMPLES"
