
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Logo from '@/components/Logo';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        // Check if Supabase is configured first
        if (!isSupabaseConfigured()) {
          // If not configured, stay on dashboard but show warning
          setLoading(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured. Please connect your project to Supabase first.');
      return;
    }

    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isSupabaseConfigured() && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
            <h3 className="font-bold mb-2">Supabase Not Connected</h3>
            <p className="mb-2">
              To enable authentication and database functionality, please connect your Lovable project to Supabase 
              using the green Supabase button in the top right corner of the Lovable interface.
            </p>
            <p className="text-sm">
              Once connected, you'll be able to use authentication, database storage, and other backend features.
            </p>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
          <p className="text-gray-600">
            This is your marketing automation dashboard. Your content will appear here once implemented.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
