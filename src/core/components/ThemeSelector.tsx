import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme';
import Icon from 'react-native-vector-icons/Feather';
import type { ThemeMode } from '../theme/ThemeContext';

import Sun from "../../assets/icons/sun.svg";
import Moon from "../../assets/icons/moon.svg";

type ThemeSelectorProps = {
  currentMode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  isCompact?: boolean;
};

export function ThemeSelector({
  currentMode,
  onModeChange,
  isCompact = false,
}: ThemeSelectorProps) {
  const { colors, spacing, typography } = useTheme();

  const handleToggle = () => {
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    onModeChange(newMode);
  };

  // if (isCompact) {
  //   return (
  //     <TouchableOpacity
  //       style={[styles.compactButton]}
  //       onPress={handleToggle}
  //     >
  //       {currentMode === 'dark' ? <Sun width={16} height={16} fill={"rgb(255, 179, 0)"} stroke={"white"} /> : <Moon width={16} height={16} />}
  //     </TouchableOpacity>
  //   );
  // }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleToggle}
      >
        {currentMode === 'dark' ? <Sun width={20} height={20} stroke={'#ffffff'} /> : <Moon width={20} height={20} stroke={"#444444"}/>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    // gap: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
});
