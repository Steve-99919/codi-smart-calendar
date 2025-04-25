
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

interface DashboardHeaderProps {
  userEmail: string | null;
  onLogout: () => Promise<void>;
}

const DashboardHeader = ({ userEmail, onLogout }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="font-medium">
            Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate('/tracking-events')}>
            Track Events
          </Button>
          <span className="text-gray-600">{userEmail}</span>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
