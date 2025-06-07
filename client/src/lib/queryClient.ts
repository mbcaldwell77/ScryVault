import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Token refresh mechanism
async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("authToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken;
    } else {
      console.warn("Refresh token invalid. Logging out...");
      // Refresh failed, clear all tokens
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("recentISBNs");
      localStorage.removeItem("scannedBooks");
      localStorage.removeItem("userPreferences");
      return null;
    }
  } catch (error) {
    console.warn("Refresh token threw an error. Logging out...");
    console.error("Token refresh failed:", error);
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("recentISBNs");
    localStorage.removeItem("scannedBooks");
    localStorage.removeItem("userPreferences");
    return null;
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T | null> {
  let token = localStorage.getItem("authToken");

  const makeRequest = async (authToken?: string) => {
    const headers: HeadersInit = {
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      "Content-Type": "application/json",
      ...options.headers,
    };

    const apiUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
    return fetch(apiUrl, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let res = await makeRequest(token || undefined);

  // If we get 401/403, try to refresh the token once
  if ((res.status === 401 || res.status === 403) && token) {
    console.log("Token expired, attempting refresh...");
    const newToken = await refreshAuthToken();

    if (newToken) {
      // Retry the request with the new token
      res = await makeRequest(newToken);
    }
  }

  // Handle authentication errors after refresh attempt
  if (res.status === 401 || res.status === 403) {
    const errorText = await res.text();
    console.error(`Authentication error ${res.status}:`, errorText);

    // Clear all authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("recentISBNs");
    localStorage.removeItem("scannedBooks");
    localStorage.removeItem("userPreferences");

    // Redirect to login only if not already on auth pages
    const currentPath = window.location.pathname;
    if (currentPath !== "/login" && currentPath !== "/register") {
      window.location.href = "/login";
    }
    throw new Error("Authentication expired. Please log in again.");
  }

  await throwIfResNotOk(res);

  // Get response text only once
  const text = await res.text();
  if (!text) return null;

  // Check if response is HTML (error page) instead of JSON
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error(`Server returned HTML instead of JSON. This may indicate an API routing issue. Response: ${text.substring(0, 200)}...`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("Response text:", text);
    throw new Error(
      `Invalid JSON response from server: ${text.substring(0, 100)}`
    );
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("authToken");

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = queryKey[0] as string;
    const apiUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
    const res = await fetch(apiUrl, {
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
