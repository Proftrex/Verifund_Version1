import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useAuth() {
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  const { data: user, isLoading, error, status } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
    enabled: !hasCheckedAuth, // Only check once initially
  });

  // Once we get any response (success or error), stop checking
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      setHasCheckedAuth(true);
    }
  }, [status]);

  const isUnauthenticated = error?.status === 401 || error?.status === 403;
  const isAuthenticated = !!user && !isUnauthenticated;
  
  return {
    user: isUnauthenticated ? null : user,
    isLoading: !hasCheckedAuth && isLoading,
    isAuthenticated,
    error: isUnauthenticated ? null : error,
  };
}
