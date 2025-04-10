
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const Index = () => {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // If Supabase is not configured, just redirect to login
        if (!isSupabaseConfigured()) {
          setRedirectTo("/login");
          return;
        }

        const { data } = await supabase.auth.getSession();
        setRedirectTo(data.session ? "/dashboard" : "/login");
      } catch (error) {
        console.error("Error checking session:", error);
        setRedirectTo("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return redirectTo ? <Navigate to={redirectTo} replace /> : null;
};

export default Index;
