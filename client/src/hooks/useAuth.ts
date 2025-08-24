import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, status } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false, // Don't retry authentication requests
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

  // Check for authentication errors
  const isUnauthenticated = error?.status === 401 || error?.status === 403;
  const hasCompletedRequest = status === 'success' || status === 'error';
  
  return {
    user: isUnauthenticated ? null : user,
    isLoading: !hasCompletedRequest,
    isAuthenticated: !!user && !isUnauthenticated,
    error: isUnauthenticated ? null : error,
  };
}
