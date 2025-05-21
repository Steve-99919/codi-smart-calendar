import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import AuthLayout from '@/components/AuthLayout';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [validResetFlow, setValidResetFlow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user has arrived here from a valid reset link
  useEffect(() => {
    const checkResetToken = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        toast.error("Invalid or expired password reset link");
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      
      // In a password reset flow, we should have a valid session
      // Since we were redirected here from Index.tsx, we can trust
      // that this is a valid reset flow
      setValidResetFlow(true);
    };
    
    checkResetToken();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (!password || !confirmPassword) {
      toast.error('Please enter and confirm your new password');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the current session to update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Password reset successfully');
      setResetSuccess(true);
      
      // Sign out after successful reset
      await supabase.auth.signOut();
      
      // Redirect to login page
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create New Password" 
      subtitle="Enter your new password below"
    >
      {!validResetFlow && !resetSuccess ? (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          <p className="font-medium">Verifying password reset request...</p>
        </div>
      ) : resetSuccess ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-md">
          <p className="font-medium">Password reset successful!</p>
          <p className="mt-2">Your password has been changed. You will be redirected to login.</p>
        </div>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-codi-purple hover:bg-codi-purple-dark"
              disabled={loading}
            >
              {loading ? 'Resetting password...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
