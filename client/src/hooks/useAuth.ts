import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, status } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Don't retry for authentication errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      // Only retry network errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false, // Don't auto-refetch to prevent auth loops
    refetchOnWindowFocus: false, // Don't refetch on window focus
    throwOnError: false, // Don't throw errors, handle them gracefully
  });

  // Handle 401 errors as "not authenticated" rather than an error state
  const isUnauthenticated = error?.status === 401;
  const hasFinishedLoading = status === 'success' || status === 'error';
  
  return {
    user: isUnauthenticated ? null : user,
    isLoading: isLoading && !isUnauthenticated && !hasFinishedLoading,
    isAuthenticated: !!user && !isUnauthenticated,
    error: isUnauthenticated ? null : error,
  };
}
