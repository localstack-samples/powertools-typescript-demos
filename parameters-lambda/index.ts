import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<string> => {
  // Retrieve a single parameter created during the CDK ddeployment
  const parameter = await getParameter('/localstack/parameter');
  
  return parameter as string;
};