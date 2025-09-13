import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const { data: session, isLoading } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      // First try to get session from Supabase
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        // If no session, try to restore from localStorage
        const token = localStorage.getItem('supabase_token');
        if (token) {
          // Validate the token by setting it
          const { data: userData, error: userError } = await supabase.auth.getUser(token);
          if (!userError && userData.user) {
            // Create a mock session object
            return {
              access_token: token,
              user: userData.user,
              expires_at: Date.now() + 3600 * 1000 // 1 hour from now
            };
          }
          // Remove invalid token
          localStorage.removeItem('supabase_token');
        }
        return null;
      }

      // Store valid token in localStorage
      if (data.session?.access_token) {
        localStorage.setItem('supabase_token', data.session.access_token);
      }

      return data.session;
    },
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    user: session?.user,
    isLoading,
    isAuthenticated: !!session && !!session.user,
    session,
  };
}