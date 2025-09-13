import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const { data: session, isLoading } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    retry: false,
  });

  return {
    user: session?.user,
    isLoading,
    isAuthenticated: !!session,
    session,
  };
}