
import { Button } from '@/components/ui/button';
import AddActivityForm from '@/components/AddActivityForm';
import GoogleCalendarImport from '@/components/GoogleCalendarImport';
import { CSVRow } from '@/types/csv';

interface DashboardActionsProps {
  onAddActivity: (activity: CSVRow) => void;
  data: CSVRow[];
  onExportCSV: () => void;
  onUploadAnother: () => void;
  onTrackCSV: () => void;
  savingToDatabase: boolean;
}

const DashboardActions = ({
  onAddActivity,
  data,
  onExportCSV,
  onUploadAnother,
  onTrackCSV,
  savingToDatabase
}: DashboardActionsProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold"></h2>
      <div className="flex gap-2">
        <AddActivityForm 
          data={data} 
          onAddActivity={onAddActivity} 
        />
        <GoogleCalendarImport data={data} />
        <Button
          variant="outline"
          onClick={onExportCSV}
        >
          Export as CSV
        </Button>
        <Button
          variant="outline"
          onClick={onUploadAnother}
        >
          Upload another file
        </Button>
        <Button
          onClick={onTrackCSV}
          disabled={savingToDatabase || (!data.length)}
        >
          Track My CSV
        </Button>
      </div>
    </div>
  );
};

export default DashboardActions;
