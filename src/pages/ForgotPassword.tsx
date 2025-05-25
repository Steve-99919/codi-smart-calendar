
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import AuthLayout from '@/components/AuthLayout';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
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
      
      toast.success('Password reset email sent! Check your inbox.');
      setEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Reset Your Password" 
      subtitle="Enter your email to receive a reset link"
    >
      <form onSubmit={handleResetPassword}>
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
          </div>
          
          <Button
            type="submit"
            className="w-full bg-codi-purple hover:bg-codi-purple-dark"
            disabled={loading}
          >
            {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </Button>
          
          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-gray-600 flex items-center justify-center gap-1 hover:text-codi-purple">
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
