import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Convert Express API routes to Netlify function routes
function getApiUrl(url: string): string {
  // Check if we're in a Netlify environment (no server running on specific port)
  const isNetlify = window.location.hostname.includes('.netlify.app') || 
                   window.location.hostname.includes('.netlify.dev') ||
                   !window.location.port;
  
  if (isNetlify) {
    // Convert /api/tasks to /.netlify/functions/tasks
    if (url.startsWith('/api/tasks')) {
      return url.replace('/api/tasks', '/.netlify/functions/tasks');
    }
    // Handle other API routes that might be added later
    if (url.startsWith('/api/')) {
      const endpoint = url.replace('/api/', '');
      return `/.netlify/functions/${endpoint}`;
    }
  }
  
  return url; // Return original URL for development
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const apiUrl = getApiUrl(url);
  
  const res = await fetch(apiUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const apiUrl = getApiUrl(url);
    
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
