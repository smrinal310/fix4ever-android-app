import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

import { useTheme } from '../../core/theme';
import { ServiceRequestStack } from './ServiceRequestStack';


export function CreateServiceRequestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, spacing, typography } = useTheme();

  const [addressPredictions, setAddressPredictions] = useState<any[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);


  // Debounce utility
  const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Address autocomplete
  const fetchAutocomplete = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setAddressPredictions([]);
        return;
      }

      setLoadingAddress(true);
      try {
        // Mock API call - replace with actual Google Places API
        await new Promise((resolve: any) => setTimeout(resolve, 300));
        setAddressPredictions([
          { place_id: '1', description: `${query}, New York, NY` },
          { place_id: '2', description: `${query}, Los Angeles, CA` },
        ]);
      } catch (error) {
        console.error('Address autocomplete error:', error);
      } finally {
        setLoadingAddress(false);
      }
    }, 300),
    []
  );



   

  // Pricing calculation (mock)
  const calculatePricing = () => {
    return {
      finalChargeRange: { min: 500, max: 1500 }
    };
  };

  const calculatedPricing = calculatePricing();


  const styles = useMemo(
        ()=>
          StyleSheet.create({
            container: {
              flex: 1,
              backgroundColor: colors.background,
            },
            scroll: {
              flex: 1,
              backgroundColor: colors.background,
            },
          })
        ,[colors, spacing, typography, insets])

  return (
    <View style={styles.container}>
      <ServiceRequestStack
          // addressQuery={addressQuery}
          // setAddressQuery={setAddressQuery}
          // addressPredictions={addressPredictions}
          // fetchAutocomplete={fetchAutocomplete}
          // loadingAddress={loadingAddress}
          // calculatedPricing={calculatedPricing}
          navigation={navigation}
        />
      </View>
  );
}
