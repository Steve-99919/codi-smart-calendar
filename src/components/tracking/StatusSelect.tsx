
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
  // Map legacy status values if they somehow still exist
  const normalizedStatus = 
    status === 'pending' ? 'upcoming' :
    status === 'done' ? 'completed' :
    status;
    
  const found = STATUS_OPTIONS.find((opt) => opt.value === normalizedStatus);
  return found ? found.colorClass : '';
};

const StatusSelect = ({ value, onChange, disabled }: StatusSelectProps) => {
  // Map legacy status values to new ones if they somehow still exist
  const normalizedValue = 
    value === 'pending' ? 'upcoming' : 
    value === 'done' ? 'completed' : 
    value;
  
  return (
    <Select
      value={normalizedValue}
      onValueChange={(value: EventStatus) => onChange(value)}
      disabled={disabled}
    >
      <SelectTrigger className={`w-28 h-8 text-sm ${getStatusColorClass(normalizedValue)}`}>
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
