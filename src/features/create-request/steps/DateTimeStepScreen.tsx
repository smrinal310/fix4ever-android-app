import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../../core/theme';
import UserDateTimeSelector from './UserDateTimeSelector';

import { FormData  } from '../ServiceRequestStack';

interface DateTimeStepScreenProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onBack: () => void;
}

export function DateTimeStepScreen({
  formData,
  updateFormData,
  errors,
  onNext,
  onBack,
}: DateTimeStepScreenProps) {
  const { colors, spacing, typography } = useTheme();

  const handleDateSlotSelect = (dateValue: string, slotValue: string) => {
    console.log('dateValue', dateValue);
    console.log('slotValue', slotValue);
    updateFormData('preferredDate', dateValue);
    updateFormData('preferredTime', slotValue);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,
    scroll: {
      flex: 1,
    } as ViewStyle,
    scrollContent: {
      padding: spacing.md,
    } as ViewStyle,
    section: {
      marginBottom: spacing.lg,
    } as ViewStyle,
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <UserDateTimeSelector
          preferredDate={formData.preferredDate || undefined}
          preferredTime={formData.preferredTime || undefined}
          onDateSlotSelect={handleDateSlotSelect}
          error={errors.preferredDate || errors.preferredTime}
        />
      </View>
    </ScrollView>
  );
}
