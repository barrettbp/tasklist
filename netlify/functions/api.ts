import serverless from 'serverless-http';
import app, { getApp } from '../../server/index';

// Ensure app is initialized before creating handler
const handler = serverless(app);

export { handler };