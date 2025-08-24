import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Retry up to 3 times for network errors, but not for actual 401s
      if (error?.message?.includes('401') || error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds to maintain session
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
