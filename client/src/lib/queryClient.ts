import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem('authToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Handle authentication errors by clearing invalid tokens
  if (res.status === 401 || res.status === 403) {
    const errorText = await res.text();
    if (errorText.includes('Invalid token') || errorText.includes('expired')) {
      // Clear invalid authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('recentISBNs');
      localStorage.removeItem('scannedBooks');
      localStorage.removeItem('userPreferences');
      
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Authentication expired. Please log in again.');
    }
  }

  await throwIfResNotOk(res);
  
  // Handle empty responses
  const text = await res.text();
  if (!text) return null;
  
  // Check if response is HTML (error page) instead of JSON
  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
    throw new Error('Server returned HTML error page instead of JSON');
  }
  
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('authToken');
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
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
