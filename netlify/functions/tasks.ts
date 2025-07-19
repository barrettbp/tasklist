import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getMemStorage } from '../../server/storage';
import { z } from 'zod';
import { insertTaskSchema, type Task } from '../../shared/schema';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('Netlify function called:', {
    method: event.httpMethod,
    path: event.path,
    query: event.queryStringParameters
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const storage = getMemStorage();
  
  try {
    // Extract the path from the API call - remove both possible prefixes
    let path = event.path;
    if (path.startsWith('/.netlify/functions/tasks')) {
      path = path.replace('/.netlify/functions/tasks', '');
    } else if (path.startsWith('/api/tasks')) {
      path = path.replace('/api/tasks', '');
    }
    
    const method = event.httpMethod;

    console.log('Processed path:', path, 'method:', method);

    // Handle different API routes
    if (method === 'GET' && (path === '' || path === '/')) {
      // GET /api/tasks
      const tasks = await storage.getAllTasks();
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks),
      };
    }

    if (method === 'POST' && (path === '' || path === '/')) {
      // POST /api/tasks
      const body = event.body ? JSON.parse(event.body) : {};
      const validatedData = insertTaskSchema.parse(body);
      const task = await storage.createTask(validatedData);
      return {
        statusCode: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      };
    }

    if (method === 'PATCH' && path.startsWith('/')) {
      // PATCH /api/tasks/:id
      const id = parseInt(path.slice(1));
      const body = event.body ? JSON.parse(event.body) : {};
      const validatedData = insertTaskSchema.partial().parse(body);
      const task = await storage.updateTask(id, validatedData);
      
      if (!task) {
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Task not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      };
    }

    if (method === 'DELETE' && path.startsWith('/')) {
      // DELETE /api/tasks/:id
      const id = parseInt(path.slice(1));
      await storage.deleteTask(id);
      return {
        statusCode: 204,
        headers: corsHeaders,
        body: '',
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Not found' }),
    };

  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          path: event.path,
          method: event.httpMethod,
          query: event.queryStringParameters
        }
      }),
    };
  }
};