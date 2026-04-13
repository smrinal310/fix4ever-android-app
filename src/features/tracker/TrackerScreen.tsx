import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme';
import { Button } from '../../core/components';

const TRACKING_DATA = [
  {
    id: '1',
    title: 'Laptop Screen Repair',
    currentStatus: 'Technician Assigned',
    progress: 40,
    estimatedCompletion: '2024-02-15',
    technician: 'John Doe',
    lastUpdate: '2024-02-12 10:30 AM',
  },
  {
    id: '2',
    title: 'Phone Battery Replacement',
    currentStatus: 'Parts Ordered',
    progress: 25,
    estimatedCompletion: '2024-02-18',
    technician: 'Jane Smith',
    lastUpdate: '2024-02-12 09:15 AM',
  },
];

const STATUS_STEPS = [
  'Request Received',
  'Technician Assigned',
  'Parts Ordered',
  'In Progress',
  'Quality Check',
  'Completed',
];

export function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return colors.success;
    if (progress >= 50) return colors.warning;
    return colors.primary;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
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
    trackerCard: {
      backgroundColor: colors.card,
      padding: spacing.lg,
      borderRadius: 12,
      marginBottom: spacing.lg,
      shadowColor: colors.foreground,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    trackerHeader: {
      marginBottom: spacing.lg,
    },
    trackerTitle: {
      ...typography.subtitle,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    trackerMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    metaItem: {
      flex: 1,
    },
    metaLabel: {
      ...typography.caption,
      color: colors.mutedForeground,
      marginBottom: 2,
    },
    metaValue: {
      ...typography.bodySmall,
      color: colors.foreground,
      fontWeight: '500',
    },
    progressSection: {
      marginBottom: spacing.lg,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    progressLabel: {
      ...typography.bodySmall,
      color: colors.foreground,
    },
    progressPercentage: {
      ...typography.bodySmall,
      color: colors.foreground,
      fontWeight: '600',
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    statusTimeline: {
      marginTop: spacing.md,
    },
    statusTitle: {
      ...typography.bodySmall,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    statusSteps: {
      gap: spacing.sm,
    },
    statusStep: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.sm,
    },
    statusDotActive: {
      backgroundColor: colors.primary,
    },
    statusDotCompleted: {
      backgroundColor: colors.success,
    },
    statusDotPending: {
      backgroundColor: colors.border,
    },
    statusText: {
      ...typography.caption,
      color: colors.foreground,
    },
    statusTextActive: {
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyTitle: {
      ...typography.subtitle,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    emptySubtitle: {
      ...typography.body,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaProvider>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Request Tracker</Text>
          <Text style={styles.subtitle}>Monitor the progress of your service requests</Text>
        </View>

        {TRACKING_DATA.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Active Requests</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any requests being tracked at the moment.
            </Text>
          </View>
        ) : (
          TRACKING_DATA.map((tracker) => (
            <TouchableOpacity key={tracker.id} style={styles.trackerCard}>
              <View style={styles.trackerHeader}>
                <Text style={styles.trackerTitle}>{tracker.title}</Text>
                <View style={styles.trackerMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Technician</Text>
                    <Text style={styles.metaValue}>{tracker.technician}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Est. Completion</Text>
                    <Text style={styles.metaValue}>{tracker.estimatedCompletion}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressPercentage}>{tracker.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${tracker.progress}%`,
                        backgroundColor: getProgressColor(tracker.progress),
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statusTimeline}>
                <Text style={styles.statusTitle}>Status Timeline</Text>
                <View style={styles.statusSteps}>
                  {STATUS_STEPS.map((step, index) => {
                    const stepIndex = Math.floor((tracker.progress / 100) * (STATUS_STEPS.length - 1));
                    const isActive = index === stepIndex;
                    const isCompleted = index < stepIndex;
                    const isPending = index > stepIndex;

                    return (
                      <View key={step} style={styles.statusStep}>
                        <View
                          style={[
                            styles.statusDot,
                            isActive && styles.statusDotActive,
                            isCompleted && styles.statusDotCompleted,
                            isPending && styles.statusDotPending,
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            isActive && styles.statusTextActive,
                          ]}
                        >
                          {step}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaProvider>
  );
}
