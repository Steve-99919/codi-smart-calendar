
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import AuthLayout from '@/components/AuthLayout';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Password reset instructions sent to your email');
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Reset Your Password" 
      subtitle="Enter your email to receive reset instructions"
    >
      {submitted ? (
        <div className="space-y-6 text-center">
          <div className="bg-green-50 text-green-700 p-4 rounded-md">
            <p>We've sent password reset instructions to your email.</p>
            <p className="mt-2">Please check your inbox and follow the link in the email.</p>
          </div>
          <Link to="/login">
            <Button variant="outline" className="mt-4">Back to Login</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleResetRequest}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Enter the email address associated with your account, and we'll send you a link to reset your password.
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-codi-purple hover:bg-codi-purple-dark"
              disabled={loading}
            >
              {loading ? 'Sending instructions...' : 'Send Reset Instructions'}
            </Button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="text-codi-purple hover:underline font-medium">
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
