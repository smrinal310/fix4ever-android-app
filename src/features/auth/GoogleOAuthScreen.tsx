import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import { useTheme } from '../../core/theme';
import { config } from '../../core/config';
import { fetchProfileWithToken, type User } from '../../core/api';

type GoogleOAuthScreenProps = {
  onBack: () => void;
  onSuccess: (token: string, user: User) => void;
};

const GOOGLE_CALLBACK_PATH = '/auth/oauth/callback';

export function GoogleOAuthScreen({
  onBack,
  onSuccess,
}: GoogleOAuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendBase = useMemo(
    () => config.API_BASE_URL.replace(/\/api$/, ''),
    []
  );

  const authUrl = useMemo(
    () => `${config.API_BASE_URL}/auth/google/login?frontend=app`,
    []
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backButton: {
      paddingVertical: spacing.sm,
      paddingRight: spacing.sm,
    },
    backText: {
      ...typography.label,
      color: colors.primary,
    },
    title: {
      ...typography.title,
      color: colors.foreground,
      marginLeft: spacing.md,
    },
    webview: {
      flex: 1,
      backgroundColor: colors.background,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.destructive,
      textAlign: 'center',
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    retryButton: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    retryText: {
      ...typography.label,
      color: colors.primary,
    },
  });

  const handleOAuthComplete = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cookies = await CookieManager.get(backendBase);
      const tokenCookie = (cookies as any)?.token;
      const token =
        typeof tokenCookie === 'string' ? tokenCookie : tokenCookie?.value;

      if (!token) {
        setError('Could not read login session. Please try again.');
        setLoading(false);
        return;
      }

      const { data, error: apiError } = await fetchProfileWithToken(token);
      if (apiError || !data?.success || !data.user) {
        setError(
          apiError?.message || 'Failed to load your profile after login.'
        );
        setLoading(false);
        return;
      }

      onSuccess(token, data.user);
    } catch (e: any) {
      setError(
        e?.message ||
          'Something went wrong while completing Google sign-in. Please try again.'
      );
      setLoading(false);
    }
  }, [backendBase, onSuccess]);

  const handleShouldStart = useCallback(
    (request: any) => {
      const url: string = request?.url || '';

      if (
        url.includes(GOOGLE_CALLBACK_PATH) &&
        url.includes('provider=google')
      ) {
        // OAuth flow finished – fetch token from backend cookie and complete login.
        handleOAuthComplete();
        return false;
      }

      return true;
    },
    [handleOAuthComplete]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Continue with Google</Text>
      </View>

      <WebView
        source={{ uri: authUrl }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState
        onShouldStartLoadWithRequest={handleShouldStart}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
