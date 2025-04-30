
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityWithStatus } from "@/types/event";
import StatusSelect from "./StatusSelect";
import { EventStatus } from "@/types/event";

interface ActivitiesTableProps {
  activities: ActivityWithStatus[];
  onStatusChange: (activityId: string, status: EventStatus) => void;
  updatingStatus: { [key: string]: boolean };
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/');
};

const ActivitiesTable = ({ 
  activities, 
  onStatusChange, 
  updatingStatus 
}: ActivitiesTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PREP Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GO Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.activity_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.activity_name}</td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{activity.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.strategy}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.prep_date)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.go_date)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {activity.status ? (
                  <StatusSelect
                    value={activity.status.status}
                    onChange={(value) => onStatusChange(activity.id, value)}
                    disabled={updatingStatus[activity.id]}
                  />
                ) : (
                  <StatusSelect
                    value="upcoming"
                    onChange={(value) => onStatusChange(activity.id, value)}
                    disabled={updatingStatus[activity.id]}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivitiesTable;
