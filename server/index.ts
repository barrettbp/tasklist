import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize app configuration
async function initializeApp() {
  try {
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      if (process.env.NODE_ENV === "development") {
        throw err;
      }
    });

    // Setup Vite for development or serve static files for production
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    return { app, server };
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

// Initialize the app for serverless deployment
let appInitialized = false;

async function initializeForServerless() {
  if (!appInitialized) {
    await initializeApp();
    appInitialized = true;
  }
  return app;
}

// Export the app for serverless deployment
export default app;

// For local development - only start server if not in production and not imported as module
if (process.env.NODE_ENV !== "production" && import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const { server } = await initializeApp();
    appInitialized = true;
    
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  })().catch(console.error);
}

export { initializeForServerless };
