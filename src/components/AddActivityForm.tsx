
import { Button } from '@/components/ui/button';
import { CSVRow } from '@/types/csv';
import { useActivityForm } from '@/hooks/useActivityForm';
import { PreferenceDialog } from './activity/PreferenceDialog';
import { ConflictAlertDialog } from './activity/ConflictAlertDialog';
import { ActivityFormDialog } from './activity/ActivityFormDialog';

interface AddActivityFormProps {
  data: CSVRow[];
  onAddActivity: (newActivity: CSVRow) => void;
}

const AddActivityForm = ({ data, onAddActivity }: AddActivityFormProps) => {
  const {
    showPreferenceDialog,
    setShowPreferenceDialog,
    showAddForm,
    setShowAddForm,
    allowWeekends,
    setAllowWeekends,
    allowHolidays,
    setAllowHolidays,
    showConflictAlert,
    setShowConflictAlert,
    conflictMessage,
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
    handleSubmit,
    handleContinueAnyway,
    getNextNumber
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
        open={showAddForm}
        onOpenChange={setShowAddForm}
        activityIdPrefix={activityIdPrefix}
        selectedPrepDate={selectedPrepDate}
        selectedGoDate={selectedGoDate}
        newActivity={newActivity}
        getNextNumber={getNextNumber}
        handlePrefixChange={handlePrefixChange}
        handlePrepDateSelect={handlePrepDateSelect}
        handleGoDateSelect={handleGoDateSelect}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />

      <ConflictAlertDialog 
        open={showConflictAlert}
        onOpenChange={setShowConflictAlert}
        message={conflictMessage}
        onContinue={handleContinueAnyway}
      />
    </>
  );
};

export default AddActivityForm;
