
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyToken = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!tokenHash || type !== 'recovery') {
        setError('Invalid or missing reset token. Please request a new password reset.');
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          setIsAuthenticated(true);
          toast.success('Email verified! You can now set your new password.');
        }
      } catch (error: any) {
        console.error('Token verification error:', error);
        setError(error.message || 'Failed to verify reset token. Please request a new password reset.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please fill out all fields');
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
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Password updated successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthLayout title="Reset Your Password">
        <div className="text-center py-8">
          <p className="text-gray-600">Verifying reset token...</p>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout title="Reset Your Password">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => navigate('/forgot-password')}
            variant="outline"
            className="text-codi-purple border-codi-purple hover:bg-codi-purple hover:text-white"
          >
            Request New Reset Link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout title="Reset Your Password">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">You are not authenticated to reset your password.</p>
          <Button
            onClick={() => navigate('/forgot-password')}
            variant="outline"
            className="text-codi-purple border-codi-purple hover:bg-codi-purple hover:text-white"
          >
            Request New Reset Link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Your Password">
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
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-codi-purple hover:bg-codi-purple-dark"
            disabled={loading}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
