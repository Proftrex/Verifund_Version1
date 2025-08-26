import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, status } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

  // In development mode, be more permissive with authentication
  const isDevelopment = import.meta.env.DEV;
  const isUnauthenticated = (error as any)?.status === 401 || (error as any)?.status === 403;
  
  // For development, always consider authenticated if not loading (even if user call fails)
  const isAuthenticated = isDevelopment ? !isLoading : (!!user && !isUnauthenticated);
  
  return {
    user: isUnauthenticated && !isDevelopment ? null : user,
    isLoading,
    isAuthenticated,
    error: isUnauthenticated && !isDevelopment ? null : error,
  };
}
