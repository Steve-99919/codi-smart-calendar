
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EventStatus } from "@/types/event";

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming', colorClass: 'bg-orange-500 text-white' },
  { value: 'completed', label: 'Completed', colorClass: 'bg-green-500 text-white' },
  { value: 'delayed', label: 'Delayed', colorClass: 'bg-red-500 text-white' },
];

interface StatusSelectProps {
  value: string;
  onChange: (value: EventStatus) => void;
  disabled?: boolean;
}

export const getStatusColorClass = (status: string) => {
  // Handle old status names first
  const mappedStatus = 
    status === 'pending' ? 'upcoming' :
    status === 'done' ? 'completed' :
    status;
    
  const found = STATUS_OPTIONS.find((opt) => opt.value === mappedStatus);
  return found ? found.colorClass : '';
};

const StatusSelect = ({ value, onChange, disabled }: StatusSelectProps) => {
  // Map old status names to new ones if needed
  const mappedValue = 
    value === 'pending' ? 'upcoming' : 
    value === 'done' ? 'completed' : 
    value;
  
  return (
    <Select
      value={mappedValue}
      onValueChange={(value: EventStatus) => onChange(value)}
      disabled={disabled}
    >
      <SelectTrigger className={`w-28 h-8 text-sm ${getStatusColorClass(mappedValue)}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className={opt.colorClass}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusSelect;
export { STATUS_OPTIONS };
