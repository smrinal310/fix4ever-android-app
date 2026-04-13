import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme';
import { Button, Input } from '../../core/components';
import { useAutoOtp } from '../../core/hooks';
import { getEmailError, validatePassword } from '../../core/utils';
import { forgotPassword, resetPassword } from '../../core/api';

const PASSWORD_HINT =
  'Min 8 characters, one uppercase, one lowercase, one number, one special character.';

type ResetPasswordScreenProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export function ResetPasswordScreen({
  onBack,
  onSuccess,
}: ResetPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useAutoOtp({
    enabled: otpSent,
    onOtp: setOtp,
    numberOfDigits: 6,
  });

  const handleSendOtp = useCallback(async () => {
    setError('');
    const emailErr = getEmailError(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    setLoading(true);
    const { data, error: err } = await forgotPassword(email.trim());
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data?.success) {
      setOtpSent(true);
      setError('');
    } else {
      setError(
        (data as { message?: string })?.message || 'Failed to send OTP.'
      );
    }
  }, [email]);

  const handleResetPassword = useCallback(async () => {
    setError('');
    const emailErr = getEmailError(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!otp.trim()) {
      setError('OTP is required.');
      return;
    }
    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.valid) {
      setError(pwdCheck.message!);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { data, error: err } = await resetPassword({
      email: email.trim(),
      otp: otp.trim(),
      newPassword,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data?.success) {
      onSuccess();
    } else {
      setError(
        (data as { message?: string })?.message || 'Password reset failed.'
      );
    }
  }, [email, otp, newPassword, confirmPassword, onSuccess]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      paddingBottom: insets.bottom + spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    backBtn: { padding: spacing.sm, marginLeft: -spacing.sm },
    backText: { ...typography.label, color: colors.primary },
    title: {
      ...typography.title,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.mutedForeground,
      marginBottom: spacing.xl,
    },
    form: { marginBottom: spacing.lg },
    hint: {
      ...typography.caption,
      color: colors.mutedForeground,
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
    },
    otpSentNote: {
      ...typography.caption,
      color: colors.primary,
      marginBottom: spacing.md,
    },
    errorText: {
      color: colors.destructive,
      marginBottom: spacing.md,
      fontSize: 14,
    },
    actions: { gap: spacing.md },
    forgotLink: {
      marginTop: spacing.sm,
      alignSelf: 'center',
    },
    forgotLinkText: {
      ...typography.caption,
      color: colors.primary,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email. We'll send a verification code, then you can set a
          new password.
        </Text>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!otpSent}
          />
          {otpSent && (
            <>
              <Text style={styles.otpSentNote}>
                Check your email for the 6-digit code. If sent via SMS, it may
                auto-fill.
              </Text>
              <Input
                label="OTP"
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
              />
              <Input
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password-new"
              />
              <Text style={styles.hint}>{PASSWORD_HINT}</Text>
              <Input
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password-new"
              />
            </>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          {!otpSent ? (
            <Button
              title="Send OTP to email"
              onPress={handleSendOtp}
              loading={loading}
              variant="primary"
            />
          ) : (
            <>
              <Button
                title="Reset password"
                onPress={handleResetPassword}
                loading={loading}
                variant="primary"
              />
              <Button
                title="Send OTP again"
                onPress={handleSendOtp}
                loading={loading}
                variant="ghost"
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
