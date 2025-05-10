
import { Button } from '@/components/ui/button';
import { CSVRow } from '@/types/csv';
import { useActivityForm } from '@/hooks/useActivityForm';
import { PreferenceDialog } from './activity/PreferenceDialog';
import { ActivityFormDialog } from './activity/ActivityFormDialog';

interface AddActivityFormProps {
  data: CSVRow[];
  onAddActivity: (newActivity: CSVRow) => void;
}

const AddActivityForm = ({ data, onAddActivity }: AddActivityFormProps) => {
  console.log("AddActivityForm received data:", data.length, "rows");
  
  const {
    showPreferenceDialog,
    setShowPreferenceDialog,
    showAddForm,
    setShowAddForm,
    allowWeekends,
    setAllowWeekends,
    allowHolidays,
    setAllowHolidays,
    selectedPrepDate,
    selectedGoDate,
    activityIdPrefix,
    newActivity,
    handlePrefixChange,
    handlePrepDateSelect,
    handleGoDateSelect,
    handleOpenAddActivity,
    handleProceedToForm,
    handleInputChange,
    handleSubmit
  } = useActivityForm({ data, onAddActivity });

  return (
    <>
      <Button onClick={handleOpenAddActivity}>Add Activity</Button>

      <PreferenceDialog 
        open={showPreferenceDialog}
        onOpenChange={setShowPreferenceDialog}
        allowWeekends={allowWeekends}
        setAllowWeekends={setAllowWeekends}
        allowHolidays={allowHolidays}
        setAllowHolidays={setAllowHolidays}
        onProceed={handleProceedToForm}
      />

      <ActivityFormDialog 
        key={`${selectedGoDate?.toString()}-${newActivity.activityName}`} // Force re-render when go date or name changes
        open={showAddForm}
        onOpenChange={setShowAddForm}
        activityIdPrefix={activityIdPrefix}
        selectedPrepDate={selectedPrepDate}
        selectedGoDate={selectedGoDate}
        newActivity={newActivity}
        handlePrefixChange={handlePrefixChange}
        handlePrepDateSelect={handlePrepDateSelect}
        handleGoDateSelect={handleGoDateSelect}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        autoPrepDate={true}
        data={data}
      />
    </>
  );
};

export default AddActivityForm;
