import { useEffect } from 'react';
import { Platform } from 'react-native';
import { startOtpListener, removeListener } from 'react-native-otp-verify';

const OTP_6_REGEX = /\b(\d{6})\b/;
const OTP_4_REGEX = /\b(\d{4})\b/;

/**
 * Auto-read OTP from SMS when it arrives (Android only, SMS Retriever API).
 * Backend SMS must include the app hash for the message to be delivered.
 * On iOS, use textContentType="oneTimeCode" on the OTP input for keyboard suggestion.
 */
export function useAutoOtp(options: {
  enabled: boolean;
  onOtp: (otp: string) => void;
  numberOfDigits?: 4 | 6;
}) {
  const { enabled, onOtp, numberOfDigits = 6 } = options;

  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') {
      return;
    }

    const handler = (message: string) => {
      const regex = numberOfDigits === 4 ? OTP_4_REGEX : OTP_6_REGEX;
      const match = message.match(regex);
      if (match?.[1]) {
        removeListener();
        onOtp(match[1]);
      }
    };

    let cancelled = false;
    startOtpListener(handler).catch(() => {
      if (!cancelled) {
        // Listener failed (e.g. timeout or not supported); user can enter manually
      }
    });

    return () => {
      cancelled = true;
      removeListener();
    };
  }, [enabled, numberOfDigits, onOtp]);
}
