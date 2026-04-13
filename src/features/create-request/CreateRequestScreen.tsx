import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme';
import { Button } from '../../core/components';
import { Input } from '../../core/components';
import { calculateServiceChargeV2, getAllProblemCategories, IssueLevel } from '../../lib/service-pricing';
import { isWithinServiceArea } from '../../lib/service-areas';
import { useNavigation } from '@react-navigation/native';

// Step configuration
export function CreateRequestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, spacing, typography } = useTheme();
  

  const styles = useMemo(()=>
        StyleSheet.create({
          container: {
            flex: 1,
            backgroundColor: colors.background,
          },
          scroll: {
            flex: 1,
            backgroundColor: colors.background,
          },
          scrollContent: {
            paddingHorizontal: spacing.lg,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
          header: {
            marginBottom: spacing.lg,
          },
          title: {
            ...typography.title,
            fontSize: 28,
            color: colors.foreground,
            marginBottom: spacing.sm,
          },
          subtitle: {
            ...typography.body,
            color: colors.mutedForeground,
          },
          stepIndicator: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
            paddingHorizontal: spacing.lg,
          },
          stepDot: {
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
          },
          stepDotActive: {
            backgroundColor: colors.primary,
          },
          stepDotCompleted: {
            backgroundColor: colors.primary,
          },
          stepText: {
            fontSize: 12,
            color: colors.mutedForeground,
          },
          stepTextActive: {
            color: colors.primaryForeground,
            fontWeight: 'bold',
          },
          section: {
            marginBottom: spacing.lg,
          },
          sectionTitle: {
            ...typography.subtitle,
            color: colors.foreground,
            marginBottom: spacing.md,
          },
          input: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: spacing.md,
            ...typography.body,
            color: colors.foreground,
            marginBottom: spacing.md,
          },
          textArea: {
            height: 100,
            textAlignVertical: 'top',
          },
          optionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
          },
          optionButton: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            minWidth: 100,
          },
          optionButtonSelected: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          optionText: {
            ...typography.bodySmall,
            color: colors.foreground,
            textAlign: 'center',
          },
          optionTextSelected: {
            color: colors.primaryForeground,
          },
          submitButton: {
            marginTop: spacing.lg,
          },
          navigationButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.lg,
          },
          errorText: {
            color: colors.destructive,
            fontSize: 12,
            marginTop: spacing.xs,
          },
          alternativeRequestContainer: {
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.lg,
          },
        }), [colors, spacing, typography, insets]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.alternativeRequestContainer}>
          <Button
            title="New Service Request"
            onPress={() => (navigation as any).navigate('ServiceRequestStack')}
            variant="outline"
          />
        </View>
      </ScrollView>
  );
}
