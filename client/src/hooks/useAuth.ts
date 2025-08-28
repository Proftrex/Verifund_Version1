import { useQuery } from "@tanstack/react-query";
import { auth } from "@/supabaseClient";

export function useAuth() {
  const { data: user, isLoading, error, status } = useQuery({
    queryKey: ["auth/user"],
    queryFn: async () => {
      const { user, error } = await auth.getCurrentUser();
      if (error) throw error;
      return user;
    },
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    throwOnError: false,
  });

  // Check authentication status from actual API response
  const isUnauthenticated = (error as any)?.status === 401 || (error as any)?.status === 403;
  
  // Only consider authenticated if we have a valid user and no auth errors
  const isAuthenticated = !!user && !isUnauthenticated && status === 'success';
  
  return {
    user: isUnauthenticated ? null : user,
    isLoading: status === 'loading',
    isAuthenticated,
    error: isUnauthenticated ? null : error,
  };
}
