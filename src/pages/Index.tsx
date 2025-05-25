
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if this is a password reset redirect
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        if (accessToken && refreshToken && type === 'recovery') {
          // This is a password reset link, redirect to reset password page with tokens
          const params = new URLSearchParams();
          params.set('access_token', accessToken);
          params.set('refresh_token', refreshToken);
          setRedirectTo(`/reset-password?${params.toString()}`);
          return;
        }

        // Normal session check for regular authentication flow
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
  }, [searchParams]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return redirectTo ? <Navigate to={redirectTo} replace /> : null;
};

export default Index;
