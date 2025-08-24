import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Retry up to 2 times for network errors, but not for actual 401s
      if (error?.message?.includes('401') || error?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false, // Don't auto-refetch to prevent auth loops
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
