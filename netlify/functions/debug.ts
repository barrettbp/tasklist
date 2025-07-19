import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Netlify function is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        headers: event.headers,
        queryStringParameters: event.queryStringParameters,
        body: event.body,
      }
    }),
  };
};