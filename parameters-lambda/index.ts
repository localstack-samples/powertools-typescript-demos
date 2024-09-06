import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<string> => {
  // Retrieve a single parameter created during the CDK deployment
  const parameter = await getParameter('/localstack/parameter', {
    transform: 'json',
  });
  
  return parameter as string;
};