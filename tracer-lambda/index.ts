import { Tracer } from '@aws-lambda-powertools/tracer';
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyResult } from 'aws-lambda';
import type { ItemResult } from './types.js';

const tracer = new Tracer({ serviceName: 'localstack' });
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const createItemRecord = async (
  event: Request
): Promise<ItemResult> => {
  const id = randomUUID();
  const name = "New Product";
  await dynamo.send(
    new PutCommand({
      TableName: process.env.ITEMS_TABLE_NAME,
      Item: {
        id: id,
        name: name
      },
    })
  );
  
  return {
    id: id,
    name: name,
  };
};

export const handler = async (event): Promise<APIGatewayProxyResult> => {
  const subsegment = tracer.getSegment()?.addNewSubsegment('### new subsegment');

  try {
    const newItem = await createItemRecord(event);
    // Annotate the subsegment with the new object key and then close it
    subsegment?.addAnnotation('newObjectKey', newItem.id);
    subsegment?.close();

    const body = {
      message: 'Item created',
      paymentId: newItem.id,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (error) {
    throw new Error('Error creating item');
  }
};