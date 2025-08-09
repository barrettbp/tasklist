// Netlify function to handle task operations

// Simple validation schema since we can't easily import the full Zod schema in CommonJS
function validateTaskData(data) {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Task name is required');
  }
  
  if (data.duration && (typeof data.duration !== 'number' || data.duration <= 0)) {
    throw new Error('Duration must be a positive number');
  }
  
  return {
    name: data.name,
    duration: data.duration || 25,
    isInterval: Boolean(data.isInterval),
    parentTaskId: data.parentTaskId || null
  };
}

// In-memory storage for tasks (matching the development setup)
let tasks = [];
let nextId = 1;

// Helper functions to simulate the storage interface
const storage = {
  async getTasks() {
    return tasks;
  },

  async createTask(data) {
    const task = {
      id: nextId++,
      name: data.name,
      duration: data.duration || 25,
      isInterval: data.isInterval || false,
      parentTaskId: data.parentTaskId || null
    };
    tasks.push(task);
    return task;
  },

  async updateTask(id, updates) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;
    
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    return tasks[taskIndex];
  },

  async deleteTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return false;
    
    tasks.splice(taskIndex, 1);
    return true;
  }
};

exports.handler = async (event, context) => {
  const { httpMethod, path, body } = event;

  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // GET /api/tasks - Get all tasks
    if (httpMethod === 'GET') {
      const allTasks = await storage.getTasks();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(allTasks)
      };
    }

    // POST /api/tasks - Create a new task
    if (httpMethod === 'POST') {
      const validatedData = validateTaskData(JSON.parse(body));
      
      // Set default duration to 25 minutes if not provided
      if (!validatedData.duration) {
        validatedData.duration = 25;
      }
      
      const task = await storage.createTask(validatedData);
      
      // Automatically create a 5-minute interval after the task (unless it's already an interval)
      if (!validatedData.isInterval) {
        const intervalData = {
          name: "Break",
          duration: 5,
          isInterval: true,
          parentTaskId: task.id
        };
        await storage.createTask(intervalData);
      }
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(task)
      };
    }

    // PATCH /api/tasks/:id - Update a task
    if (httpMethod === 'PATCH') {
      // Extract ID from path or query parameters
      let id;
      if (event.pathParameters && event.pathParameters.id) {
        id = parseInt(event.pathParameters.id);
      } else {
        // Fallback: extract from path (e.g., /.netlify/functions/tasks/123)
        const pathParts = event.path.split('/');
        id = parseInt(pathParts[pathParts.length - 1]);
      }
      
      if (isNaN(id)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid task ID' })
        };
      }

      const updates = validateTaskData(JSON.parse(body));
      const task = await storage.updateTask(id, updates);
      
      if (!task) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Task not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(task)
      };
    }

    // DELETE /api/tasks/:id - Delete a task
    if (httpMethod === 'DELETE') {
      // Extract ID from path or query parameters
      let id;
      if (event.pathParameters && event.pathParameters.id) {
        id = parseInt(event.pathParameters.id);
      } else {
        // Fallback: extract from path
        const pathParts = event.path.split('/');
        id = parseInt(pathParts[pathParts.length - 1]);
      }
      
      if (isNaN(id)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid task ID' })
        };
      }

      const success = await storage.deleteTask(id);
      
      if (!success) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Task not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Task deleted successfully' })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error in tasks function:', error);
    
    if (error.message.includes('Task name') || error.message.includes('Duration')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'Invalid task data', 
          error: error.message 
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message 
      })
    };
  }
};