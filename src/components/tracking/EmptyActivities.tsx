
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const EmptyActivities = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">No activities found. Import some activities from the Dashboard.</p>
      <Button
        className="mt-4"
        onClick={() => navigate('/dashboard')}
      >
        Go to Dashboard
      </Button>
    </div>
  );
};

export default EmptyActivities;
