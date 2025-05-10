
import { Button } from '@/components/ui/button';
import { CSVRow } from '@/types/csv';
import { useActivityForm } from '@/hooks/useActivityForm';
import { PreferenceDialog } from './activity/PreferenceDialog';
import { ActivityFormDialog } from './activity/ActivityFormDialog';
import { useEffect, useState } from 'react';

interface AddActivityFormProps {
  data: CSVRow[];
  onAddActivity: (newActivity: CSVRow) => void;
}

const AddActivityForm = ({ data, onAddActivity }: AddActivityFormProps) => {
  console.log("AddActivityForm received data:", data.length, "rows");
  const [isPrefixReady, setIsPrefixReady] = useState(false);
  
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
    handleSubmit,
    generateActivityId, // Now properly received from useActivityForm
    getNextNumber
  } = useActivityForm({ data, onAddActivity });

  // Track when the prefix has been properly set
  useEffect(() => {
    if (activityIdPrefix && activityIdPrefix !== 'A' || data.length === 0) {
      setIsPrefixReady(true);
    }
  }, [activityIdPrefix, data]);

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

      {/* Only render the form when prefix is ready or explicitly showing the form */}
      {(isPrefixReady || showAddForm) && (
        <ActivityFormDialog 
          key={activityIdPrefix} // Force re-render when prefix changes
          open={showAddForm}
          onOpenChange={setShowAddForm}
          activityIdPrefix={activityIdPrefix}
          selectedPrepDate={selectedPrepDate}
          selectedGoDate={selectedGoDate}
          newActivity={newActivity}
          getNextNumber={(prefix) => getNextNumber(prefix)}
          handlePrefixChange={handlePrefixChange}
          handlePrepDateSelect={handlePrepDateSelect}
          handleGoDateSelect={handleGoDateSelect}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          autoPrepDate={true}
          data={data}
          onGenerateId={generateActivityId} // Pass the generateActivityId function
        />
      )}
    </>
  );
};

export default AddActivityForm;
