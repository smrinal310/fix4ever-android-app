import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme';
import { Button } from '../../core/components';
import type { User } from '../../core/api';
import { useAuth } from '../../lib/contexts/auth-context';

type AccountScreenProps = {
  onLogout: () => void;
};

export function AccountScreen({ onLogout }: AccountScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();
  const {user } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.xl,
    },
    title: {
      ...typography.title,
      color: colors.foreground,
      marginBottom: spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      padding: spacing.lg,
      borderRadius: 12,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: { marginBottom: spacing.md },
    label: {
      ...typography.caption,
      color: colors.mutedForeground,
      marginBottom: 2,
    },
    value: {
      ...typography.body,
      color: colors.foreground,
    },
    logout: { marginTop: spacing.lg },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.username}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        {user?.phone ? (
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{user?.phone}</Text>
          </View>
        ) : null}
      </View>
      <Button
        title="Log out"
        onPress={onLogout}
        variant="outline"
        style={styles.logout}
      />
    </View>
  );
}
