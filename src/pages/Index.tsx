
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        // If we're coming from a password reset link and we're authenticated,
        // redirect to the reset password page instead of the dashboard
        if (location.hash && location.hash.includes('type=recovery') && data.session) {
          setRedirectTo("/reset-password");
        } else if (data.session) {
          setRedirectTo("/dashboard");
        } else {
          setRedirectTo("/login");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setRedirectTo("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [location]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return redirectTo ? <Navigate to={redirectTo} replace /> : null;
};

export default Index;
