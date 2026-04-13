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
import { getEmailError } from '../../core/utils';
import { sendLoginOtp, login } from '../../core/api';
import type { User } from '../../core/api';

type LoginScreenProps = {
  onBack: () => void;
  onSuccess: (token: string, user: User) => void;
  onForgotPassword?: () => void;
  onGooglePress?: () => void;
};

export function LoginScreen({
  onBack,
  onSuccess,
  onForgotPassword,
  onGooglePress,
}: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
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
    if (!password) {
      setError('Password is required.');
      return;
    }
    setLoading(true);
    const { data, error: err } = await sendLoginOtp(email.trim());
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
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    setError('');
    const emailErr = getEmailError(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (!otp.trim()) {
      setError('OTP is required.');
      return;
    }
    setLoading(true);
    const { data, error: err } = await login({
      email: email.trim(),
      password,
      otp: otp.trim(),
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data?.success && data?.token && data?.user) {
      onSuccess(data.token, data.user);
    } else {
      console.log("Login failed", data);
      setError((data as { message?: string })?.message || 'Login failed.');
    }
  }, [email, password, otp, onSuccess]);

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
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dividerText: {
      ...typography.caption,
      color: colors.mutedForeground,
      marginHorizontal: spacing.sm,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
    },
    socialText: {
      ...typography.label,
      color: colors.foreground,
    },
    forgotLink: { marginTop: spacing.sm, alignSelf: 'center' },
    forgotLinkText: { ...typography.caption, color: colors.primary },
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
        <Text style={styles.title}>Log in</Text>
        <Text style={styles.subtitle}>
          Use your email and password. We'll send a one-time code to your email.
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
            // editable={!otpSent}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            // editable={!otpSent}
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
                title="Log in"
                onPress={handleLogin}
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
          {onForgotPassword ? (
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={onForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </TouchableOpacity>
          ) : null}

          {onGooglePress && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={onGooglePress}
                activeOpacity={0.8}
              >
                <Text style={styles.socialText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
