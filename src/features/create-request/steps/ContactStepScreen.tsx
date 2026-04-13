import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { useTheme } from '../../../core/theme';
import { Input } from '../../../core/components';

import Icon from 'react-native-vector-icons/Feather';

import { FormData } from '../ServiceRequestStack';


interface ContactStepScreenProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onBack: () => void;
  addressQuery: string;
  setAddressQuery: (value: string) => void;
  addressPredictions: any[];
  fetchAutocomplete: (value: string) => void;
  loadingAddress: boolean;
  getCurrentLocation: () => void;
  isGettingLocation: boolean;
  locationError: string | null;
}

export function ContactStepScreen({
  formData,
  updateFormData,
  errors,
  onNext,
  onBack,
  addressQuery,
  setAddressQuery,
  addressPredictions,
  fetchAutocomplete,
  loadingAddress,
  getCurrentLocation,
  isGettingLocation,
  locationError,
}: ContactStepScreenProps) {
  const { colors, spacing, typography } = useTheme();

  
  // Simple text change handler - only update parent
  const handleTextChange = (field: string, value: string) => {
    updateFormData(field as any, value);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.foreground,
      marginBottom: spacing.md,
    } as TextStyle,
    optionsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      marginBottom: spacing.md,
    } as ViewStyle,
    optionButton: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: spacing.md,
      alignItems: 'center' as const,
      minHeight: 60,
      justifyContent: 'center' as const,
    } as ViewStyle,
    optionButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    } as ViewStyle,
    optionText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.mutedForeground,
      textAlign: 'center' as const,
    } as TextStyle,
    optionTextSelected: {
      color: colors.primaryForeground,
    } as TextStyle,
    addressInputContainer: {
      position: 'relative' as const,
    } as ViewStyle,
    loadingIndicator: {
      position: 'absolute' as const,
      right: 12,
      top: 12,
    } as ViewStyle,
    suggestionsContainer: {
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 200,
      zIndex: 1000,
    } as ViewStyle,
    suggestionsList: {
      maxHeight: 180,
    } as ViewStyle,
    suggestionItem: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    } as ViewStyle,
    suggestionText: {
      fontSize: 14,
      color: colors.foreground,
    } as TextStyle,
    locationSection: {
      marginTop: spacing.md,
    } as ViewStyle,
    locationLabel: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.foreground,
      marginBottom: spacing.sm,
    } as TextStyle,
    locationButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: spacing.md,
      gap: spacing.sm,
    } as ViewStyle,
    locationButtonDisabled: {
      opacity: 0.6,
    } as ViewStyle,
    locationButtonText: {
      fontSize: 16,
      color: colors.foreground,
    } as TextStyle,
    locationButtonTextDisabled: {
      color: colors.mutedForeground,
    } as TextStyle,
    locationError: {
      fontSize: 14,
      color: colors.destructive,
      marginTop: spacing.sm,
    } as TextStyle,
  });

  return (
    <ScrollView
    
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Type</Text>
        <View style={styles.optionsGrid}>
          {['self', 'other'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                formData.requestType === type && styles.optionButtonSelected,
              ]}
              onPress={() => updateFormData('requestType', type as 'self' | 'other')}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.requestType === type && styles.optionTextSelected,
                ]}
              >
                {type === 'self' ? 'For Myself' : 'For Someone Else'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Service Type</Text>
        <View style={styles.optionsGrid}>
          {[
            { id: 'pickup-drop', label: 'Pickup & Drop' },
            { id: 'visit-shop', label: 'Visit Shop' },
            { id: 'onsite', label: 'Onsite' },
          ].map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.optionButton,
                formData.serviceType === type.id && styles.optionButtonSelected,
              ]}
              onPress={() => updateFormData('serviceType', type.id as any)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.serviceType === type.id && styles.optionTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {formData.requestType === 'self' ? (
          <>
            <Input
              label="Your Name"
              value={formData.userName}
              onChangeText={(value: string) => handleTextChange('userName', value)}
              placeholder="Enter your full name"
              error={errors.userName}
              keyboardType="default"
            />
            <Input
              label="Phone Number"
              value={formData.userPhone}
              onChangeText={(value: string) => handleTextChange('userPhone', value)}
              placeholder="Enter your 10-digit phone number"
              error={errors.userPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              <View style={styles.addressInputContainer}>
                <TextInput
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: spacing.md,
                      fontSize: 16,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                      height: 120,
                    },
                    errors.address && { borderColor: colors.destructive },
                  ]}
                  value={formData.address}
                  onChangeText={(value: string) => handleTextChange('address', value)}
                  placeholder="Enter your complete address"
                  multiline
                  textAlignVertical="top"
                />
                {loadingAddress && (
                  <ActivityIndicator 
                    size="small" 
                    color={colors.primary} 
                    style={styles.loadingIndicator} 
                  />
                )}
              </View>
              {errors.address && (
                <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>
                  {errors.address}
                </Text>
              )}
              
              {addressPredictions && addressPredictions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    data={addressPredictions}
                    keyExtractor={(item) => item.place_id}
                    style={styles.suggestionsList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          {""}
                          // Dismiss keyboard after selection
                          Keyboard.dismiss();
                        }}
                      >
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
            <Input
              label="City"
              value={formData.city}
              onChangeText={(value: string) => handleTextChange('city', value)}
              error={errors.city}
              placeholder="Enter your city"
            />
            <View style={styles.locationSection}>
              <Text style={styles.locationLabel}>Get Current Location</Text>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  isGettingLocation && styles.locationButtonDisabled,
                ]}
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Icon name="map-pin" size={20} color={colors.primary} />
                )}
                <Text style={[
                  styles.locationButtonText,
                  isGettingLocation && styles.locationButtonTextDisabled,
                ]}>
                  {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>
              {locationError && (
                <Text style={styles.locationError}>{locationError}</Text>
              )}
            </View>
          </>
        ) : (
          <>
            <Input
              label="Beneficiary Name"
              value={formData.beneficiaryName}
              onChangeText={(value: string) => handleTextChange('beneficiaryName', value)}
              error={errors.beneficiaryName}
              placeholder="Enter beneficiary's full name"
            />
            <Input
              label="Beneficiary Phone Number"
              value={formData.beneficiaryPhone}
              onChangeText={(value: string) => handleTextChange('beneficiaryPhone', value)}
              error={errors.beneficiaryPhone}
              placeholder="Enter beneficiary's 10-digit phone number"
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              <View style={styles.addressInputContainer}>
                <TextInput
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: spacing.md,
                      fontSize: 16,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                      height: 120,
                    },
                    errors.address && { borderColor: colors.destructive },
                  ]}
                  value={formData.address}
                  onChangeText={(value: string) => {
                    updateFormData('address', value);
                  }}
                  placeholder="Enter complete address"
                  multiline
                  textAlignVertical="top"
                />
                {loadingAddress && (
                  <ActivityIndicator 
                    size="small" 
                    color={colors.primary} 
                    style={styles.loadingIndicator} 
                  />
                )}
              </View>
              {errors.address && (
                <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>
                  {errors.address}
                </Text>
              )}
              
              {addressPredictions && addressPredictions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    data={addressPredictions}
                    keyExtractor={(item) => item.place_id}
                    style={styles.suggestionsList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          onSelectPrediction(item);
                          // Dismiss keyboard after selection
                          Keyboard.dismiss();
                        }}
                      >
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
            <Input
              label="City"
              value={formData.city}
              onChangeText={(value: string) => handleTextChange('city', value)}
              error={errors.city}
              placeholder="Enter city"
            />
            <View style={styles.locationSection}>
              <Text style={styles.locationLabel}>Get Current Location</Text>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  isGettingLocation && styles.locationButtonDisabled,
                ]}
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Icon name="map-pin" size={20} color={colors.primary} />
                )}
                <Text style={[
                  styles.locationButtonText,
                  isGettingLocation && styles.locationButtonTextDisabled,
                ]}>
                  {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>
              {locationError && (
                <Text style={styles.locationError}>{locationError}</Text>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  </View>
    </ScrollView>
);
}
