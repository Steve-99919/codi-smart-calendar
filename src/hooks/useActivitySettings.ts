
import { useState } from 'react';

export const useActivitySettings = () => {
  const [showPreferenceDialog, setShowPreferenceDialog] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [allowWeekends, setAllowWeekends] = useState(false);
  const [allowHolidays, setAllowHolidays] = useState(false);
  
  const handleOpenPreferences = () => {
    setShowPreferenceDialog(true);
  };

  const handleProceedToForm = () => {
    setShowPreferenceDialog(false);
    setShowAddForm(true);
  };

  const handleCancelPreferences = () => {
    setShowPreferenceDialog(false);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
  };

  return {
    showPreferenceDialog,
    setShowPreferenceDialog,
    showAddForm,
    setShowAddForm,
    allowWeekends,
    setAllowWeekends,
    allowHolidays,
    setAllowHolidays,
    handleOpenPreferences,
    handleProceedToForm,
    handleCancelPreferences,
    handleCloseForm
  };
};
