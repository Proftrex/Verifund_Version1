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

  // Check authentication status from actual API response
  const isUnauthenticated = (error as any)?.status === 401 || (error as any)?.status === 403;
  
  // Only consider authenticated if we have a valid user and no auth errors
  const isAuthenticated = !!user && !isUnauthenticated;
  
  return {
    user: isUnauthenticated ? null : user,
    isLoading,
    isAuthenticated,
    error: isUnauthenticated ? null : error,
  };
}
