
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
        
        // According to Supabase docs, password reset links create a special session
        // We need to check for this type of session and redirect accordingly
        
        // Add a more comprehensive check for recovery flow
        const isPasswordResetFlow = 
          // Check the URL for any form of reset parameters
          location.href?.includes('reset') || 
          location.href?.includes('recovery') || 
          location.href?.includes('type=') ||
          // Check the current path if we're already at the reset page
          location.pathname === '/reset-password' ||
          // Check if this is a recovery audience in the session
          data.session?.user?.aud === 'recovery';
        
        if (isPasswordResetFlow && data.session) {
          // This is a password reset session, go to reset password
          setRedirectTo("/reset-password");
        } else if (data.session) {
          // Normal session, go to dashboard
          setRedirectTo("/dashboard");
        } else {
          // No session, go to login
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
