import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  FlatList,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme';
import { Button } from '../../core/components';
import { Input } from '../../core/components';

// Lazy loading image component
interface LazyImageProps {
  source: { uri: string };
  style: any;
  onLoad?: () => void;
  onError?: (error: any) => void;
  placeholder?: React.ReactNode;
}

const LazyImage = ({ source, style, onLoad, onError, placeholder }: LazyImageProps) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setShouldLoad(false);
    // Small delay to simulate lazy loading
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [source.uri]);

  if (!shouldLoad) {
    return (
      <View style={[style, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
        {placeholder || <ActivityIndicator size="small" color="#666" />}
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      onLoad={() => {
        setLoaded(true);
        onLoad && onLoad();
      }}
      onError={onError}
      fadeDuration={300}
    />
  );
};
import { calculateServiceChargeV2, 
  getAllProblemCategories, IssueLevel } from '../../lib/service-pricing';
import { isWithinServiceArea } from '../../lib/service-areas';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
// import Geolocation from 'react-native-geolocation-service';
import { getStoredToken } from '../../core/storage';
import { request, requestWithAuth } from '../../core/api';

import Config from 'react-native-config';

console.log(Config.GOOGLE_MAPS_API_KEY)

// Debounce utility function
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

// Step configuration
interface Step {
  id: string;
  title: string;
  description: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}


const STEPS: Step[] = [
  {
    id: 'contact',
    title: 'Contact & Request',
    description: 'Your contact and service preferences',
  },
  {
    id: 'brand',
    title: 'Brand',
    description: 'Select your device brand',
  },
  {
    id: 'model',
    title: 'Model',
    description: 'Select your device model',
  },
  {
    id: 'problem',
    title: 'Problem',
    description: 'Describe issue',
  },
  {
    id: 'datetime',
    title: 'Date & Time',
    description: 'When you need service',
  },
  {
    id: 'images',
    title: 'Images',
    description: 'Add photos (optional)',
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Check and submit',
  },
];



const DEVICE_TYPES = [
  'Laptop',
];

const ISSUE_TYPES = [
  'Screen Repair',
  'Battery Replacement',
  'Hardware Upgrade',
  'Software Issue',
  'Water Damage',
  'Other',
];

const TIME_SLOTS = [
  { id: '9-12', label: '9 AM - 12 PM' },
  { id: '12-15', label: '12 PM - 3 PM' },
  { id: '15-18', label: '3 PM - 6 PM' },
];




export function CreateServiceRequestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, spacing, typography } = useTheme();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  
  // Form data interface
  interface FormData {
    requestType: "self" | 'other';
    serviceType: "pickup-drop" | 'visit-shop' | 'onsite';
    userName: string;
    userPhone: string;
    beneficiaryName: string;
    beneficiaryPhone: string;
    knowsProblem: boolean;
    problemType: string;
    issueLevel: IssueLevel;
    problemDescription: string;
    warrantyOption: 'none' | '30days' | '3months';
    urgencyLevel: 'normal' | 'express' | 'urgent';
    dataSafety: boolean;
    selectedDate: string | null;
    selectedTimeSlot: string | null;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    brand: string;
    model: string;
    issueImages: File[];
    selectedBrand: string;
    deviceType: string;
    customBrandName: string;
    selectedModel: string;
  }

  // Form state
  const [formData, setFormData] = useState<FormData>({
    // Enhanced user contact and request details
    requestType: 'self' as "self" | 'other',
    serviceType: 'pickup-drop' as "pickup-drop" | 'visit-shop' | 'onsite',
    userName: '',
    userPhone: '',
    beneficiaryName: '',
    beneficiaryPhone: '',
    // Problem knowledge fields
    knowsProblem: true as boolean,
    problemType: '',
    issueLevel: 'software' as IssueLevel,
    problemDescription: '',
    // Addon options
    warrantyOption: 'none' as 'none' | '30days' | '3months',
    urgencyLevel: 'normal' as 'normal' | 'express' | 'urgent',
    dataSafety: false as boolean,
    // Date and time selection
    selectedDate: null as string | null,
    selectedTimeSlot: null as string | null,
    // Existing fields
    address: '',
    latitude: 0,
    longitude: 0,
    city: '',
    brand: '',
    model: '',
    issueImages: [] as File[],
    selectedBrand: '',
    deviceType: '',
    customBrandName: '',
    selectedModel: '',

  });

  const commonLaptopProblems = getAllProblemCategories()
    .map(category => ({
      value: category.id,
      label: category.name,
      description: category.description,
      basePrice: category.basePrice,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  useEffect(() => {
    getAllBrands();
  }, []);

  const getAllBrands = async () => {
      try {
        setLoading(true);
        // const token = await getStoredToken();
        // if (!token) throw new Error('No token found');
        
        const response = await request<ApiResponse<any>>(
          `/brands`,
          {
            method: 'POST',
            body: {device: 'laptop'},
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.data?.success) {
          const brands = response.data.data.map((brand: any, index: number) => {
            brand.key = brand.key;
            brand.name = brand.key.split("/").at(-1).split("-").at(0);
            brand.img_url = brand.url;
            brand.id = brand.key || index.toString(); // Ensure unique ID
            return brand;
          })
          setBrands(brands);
          console.log(brands)
        }
      } catch (error) {
        setError('Failed to fetch brands request');
      } finally {
        setLoading(false);
      }
    };

    const getBrandModels = async () => {
      try {
        setLoading(true);
        const response = await request<ApiResponse<any>>(
          `/models`,
          {
            method: 'POST',
            body: {device: 'laptop', brand: formData.brand},
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.data?.success) {
          
          const models = response.data.data.map((model: any, index: number) => {
            model.key = model.key;
            model.name = model.key.split("/").at(-1).split(".").at(0);
            model.id = model.key || index.toString();
            return model;
          })
          setModels(models);
          console.log('All models:', models);
        } else {
          console.log('Models API error:', response.data);
        }

      } catch (error) {
        setError('Failed to fetch models request');
      } finally {
        setLoading(false);
      }
    }
  
  // Form errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Location state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Pricing state
  const [calculatedPricing, setCalculatedPricing] = useState<any>(null);

  // Address autocomplete state
  const [addressQuery, setAddressQuery] = useState('');
  const [addressPredictions, setAddressPredictions] = useState<any[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Brand search state
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [customBrand, setCustomBrand] = useState('');

  // Helper functions
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        Geolocation.requestAuthorization(
          (success) => resolve(success === 'granted' || success === 'always'),
          (error) => {
            console.log('iOS location permission error:', error);
            resolve(false);
          }
        );
      });
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message: 'This app needs access to your location to provide service at your area.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocationError('Location permission denied');
        setIsGettingLocation(false);
        return;
      }

      // Configure geolocation settings for better reliability
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
      });

      // Try with high accuracy first, then fallback to lower accuracy
      const tryGetLocation = (highAccuracy: boolean) => {
        return new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => reject(error),
            {
              enableHighAccuracy: highAccuracy,
              timeout: highAccuracy ? 10000 : 15000,
              maximumAge: highAccuracy ? 1000 : 60000,
            }
          );
        });
      };

      let position;
      try {
        // First try with high accuracy
        position = await tryGetLocation(true);
      } catch (highAccuracyError) {
        console.log('High accuracy location failed, trying with lower accuracy:', highAccuracyError);
        try {
          // Fallback to lower accuracy
          position = await tryGetLocation(false);
        } catch (lowAccuracyError) {
          throw lowAccuracyError;
        }
      }

      // Successfully got position
      const { latitude, longitude } = (position as any).coords;
      updateFormData('latitude', latitude);
      updateFormData('longitude', longitude);
      setIsGettingLocation(false);
      setLocationError(null);
      
      Alert.alert(
        'Location Detected',
        `Your location has been detected successfully.\nLatitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setLocationError('Failed to get location');
      setIsGettingLocation(false);
    }
  };

  // Places autocomplete
  const fetchAutocomplete = useCallback(
    debounce(async (text: string) => {
      console.log('fetchAutocomplete called with:', text);
      console.log('GOOGLE_MAPS_API_KEY exists:', !!Config.GOOGLE_MAPS_API_KEY);
      console.log('GOOGLE_MAPS_API_KEY value:', Config.GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...');
      
      if (!text || !Config.GOOGLE_MAPS_API_KEY) {
        console.log('Early return: no text or no API key');
        setAddressPredictions([]);
        return;
      }
      
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text,
        )}&key=${Config.GOOGLE_MAPS_API_KEY}&components=country:in&language=en`;
        
        console.log('Fetching URL:', url.replace(/key=[^&]*/, 'key=***'));
        
        const response = await fetch(url);
        const json = await response.json();
        
        console.log('API Response status:', json.status);
        console.log('API Response predictions count:', json.predictions?.length || 0);
        console.log( json.predictions)
        
        if (json.status === 'OK' && Array.isArray(json.predictions)) {
          console.log('Setting predictions:', json.predictions.length);
          setAddressPredictions(json.predictions);
        } else {
          console.log('API Error:', json.status, json.error_message || 'No error message');
          setAddressPredictions([]);
        }
      } catch (e) {
        console.error('Autocomplete error:', e);
        setAddressPredictions([]);
      }
    }, 300),
    []
  );

  const onSelectPrediction = async (place: any) => {
    setAddressQuery(place.description);
    setAddressPredictions([]);
    updateFormData('address', place.description);
    
    if (!Config.GOOGLE_MAPS_API_KEY) return;
    
    setLoadingAddress(true);
    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${Config.GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(detailsUrl);
      const json = await response.json();
      
      if (json.status === 'OK' && json.result?.geometry?.location) {
        const loc = json.result.geometry.location;
        updateFormData('latitude', loc.lat);
        updateFormData('longitude', loc.lng);
        
        // Extract city from address components if available
        if (json.result.address_components) {
          const cityComponent = json.result.address_components.find((comp: any) =>
            comp.types.includes('locality')
          );
          if (cityComponent) {
            updateFormData('city', cityComponent.long_name);
          }
        }
        
        console.log('Location set from autocomplete:', { lat: loc.lat, lng: loc.lng });
      } else {
        console.warn('place details error:', json.status, json.error_message);
      }
    } catch (e) {
      console.warn('place details fetch failed', e);
    } finally {
      setLoadingAddress(false);
    }
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 0: // Contact & Request
        if (!formData.requestType) {
          newErrors.requestType = 'Request type is required';
        }
        if (!formData.serviceType) {
          newErrors.serviceType = 'Service type is required';
        }
        if (formData.requestType === 'self') {
          if (!formData.userName.trim()) {
            newErrors.userName = 'Name is required';
          }
          if (!formData.userPhone.trim()) {
            newErrors.userPhone = 'Phone number is required';
          } else if (!/^\d{10}$/.test(formData.userPhone)) {
            newErrors.userPhone = 'Phone number must be exactly 10 digits';
          }
        }
        if (formData.requestType === 'other') {
          if (!formData.beneficiaryName.trim()) {
            newErrors.beneficiaryName = 'Beneficiary name is required';
          }
          if (!formData.beneficiaryPhone.trim()) {
            newErrors.beneficiaryPhone = 'Beneficiary phone is required';
          } else if (!/^\d{10}$/.test(formData.beneficiaryPhone)) {
            newErrors.beneficiaryPhone = 'Phone number must be exactly 10 digits';
          }
        }
        if (!formData.address.trim()) {
          newErrors.address = 'Address is required';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'City is required';
        }
        if (formData.latitude === 0 || formData.longitude === 0) {
          newErrors.location = 'Please enable location services';
        }
        break;

      case 1: // Brand
        if (!formData.selectedBrand.trim()) {
          newErrors.selectedBrand = 'Brand selection is required';
        }
        break;

      case 2: // Model
        if (!formData.selectedModel.trim()) {
          newErrors.selectedModel = 'Model selection is required';
        }
        break;

      case 3: // Problem
        if (formData.knowsProblem) {
          if (!formData.problemType || formData.problemType.trim() === '') {
            newErrors.problemType = 'Please select a problem type';
          }
        }
        if (!formData.problemDescription.trim()) {
          newErrors.problemDescription = 'Problem description is required';
        }
        break;

      case 4: // Date & Time
        if (!formData.selectedDate) {
          newErrors.selectedDate = 'Please select a date';
        }
        if (!formData.selectedTimeSlot) {
          newErrors.selectedTimeSlot = 'Please select a time slot';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      // Call getBrandModels when on brand step (step 1)
      if (currentStep === 1) {
        getBrandModels();
      }
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      Alert.alert('Error', 'Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const calculatePricing = () => {
    try {
      const pricing = calculateServiceChargeV2({
        knowsProblem: formData.knowsProblem,
        problemType: formData.problemType,
        issueLevel: formData.issueLevel,
        serviceType: formData.serviceType,
        warrantyOption: formData.warrantyOption,
        urgencyLevel: formData.urgencyLevel,
        dataSafety: formData.dataSafety,
      });
      setCalculatedPricing(pricing);
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      Alert.alert('Error', 'Please fix errors in form');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit service request
      console.log('Creating service request:', formData);
      Alert.alert(
        'Success',
        'Service request created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create service request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get problem categories for selection
  const problemCategories = getAllProblemCategories().map(category => ({
    value: category.id,
    label: category.name,
    description: category.description,
  }));

  // Calculate pricing when relevant fields change
  useEffect(() => {
    if (formData.knowsProblem && formData.problemType) {
      calculatePricing();
    }
  }, [formData.knowsProblem, formData.problemType, formData.issueLevel, formData.serviceType, formData.warrantyOption, formData.urgencyLevel, formData.dataSafety]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingTop: spacing.md + insets.top,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
    },
    backButton: {
      padding: spacing.sm,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      paddingBottom: insets.bottom + spacing.xxl,
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
    brandOption: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      minHeight: 100,
      shadowColor: colors.foreground,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    brandOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
    },
    brandContent: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    brandLogo: {
      fontSize: 24,
    },
    brandName: {
      ...typography.bodySmall,
      color: colors.foreground,
      textAlign: 'center',
      fontWeight: '500',
    },
    brandNameSelected: {
      color: colors.foreground, // Keep text black/normal color
      fontWeight: '600',
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
    locationSection: {
      marginBottom: spacing.lg,
    },
    locationLabel: {
      ...typography.body,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    locationButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationButtonDisabled: {
      opacity: 0.5,
    },
    locationButtonText: {
      ...typography.bodySmall,
      color: colors.foreground,
      marginLeft: spacing.xs,
    },
    locationButtonTextDisabled: {
      color: colors.mutedForeground,
    },
    locationError: {
      color: colors.destructive,
      fontSize: 12,
      marginTop: spacing.xs,
    },
    // Address autocomplete styles
    addressInputContainer: {
      position: 'relative',
    },
    addressInput: {
      minHeight: 80,
    },
    inputError: {
      borderColor: colors.destructive,
    },
    loadingIndicator: {
      position: 'absolute',
      right: 12,
      top: 12,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderTopWidth: 0,
      borderRadius: 8,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      maxHeight: 200,
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    suggestionsList: {
      flex: 1,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.foreground,
    },
    // Brand grid styles
    searchContainer: {
      marginBottom: spacing.md,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: spacing.md,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.background,
      marginBottom: spacing.md,
    },

    modelGrid: {
      flexDirection: 'column',
      flexWrap: 'nowrap',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    brandGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      
      marginBottom: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    brandRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    
    brandItem: {
      width: '45%',
      aspectRatio: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      marginHorizontal: spacing.xs,
      borderWidth: 2,
      borderColor: 'transparent',
    },

    modelItem: {
      width: "100%",
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: spacing.sm,
      marginBottom: 10,
      marginHorizontal: spacing.xs,
      borderWidth: 2,
      borderColor: 'transparent',
      height: 80,
    },
    
    brandItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    // Other brand and custom brand styles
    otherBrandIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    otherBrandIconText: {
      fontSize: 24,
      color: colors.mutedForeground,
      fontWeight: 'bold',
    },
    customBrandContainer: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    customBrandLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    customBrandInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: spacing.md,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
  });

  // Step Components
  const renderContactStep = () => (
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
            onChangeText={(value) => updateFormData('userName', value)}
            error={errors.userName}
            placeholder="Enter your full name"
          />
          <Input
            label="Your Phone Number"
            value={formData.userPhone}
            onChangeText={(value) => updateFormData('userPhone', value)}
            error={errors.userPhone}
            placeholder="Enter 10-digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.addressInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.addressInput,
                  errors.address && styles.inputError
                ]}
                value={addressQuery || formData.address}
                onChangeText={(value) => {
                  console.log('Address input changed (self):', value);
                  setAddressQuery(value);
                  fetchAutocomplete(value);
                  updateFormData('address', value);
                }}
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
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
            
            {/* Address suggestions dropdown */}
            {(() => {
              console.log('Rendering suggestions (self), count:', addressPredictions.length);
              return addressPredictions.length > 0;
            })() && (
              <View style={styles.suggestionsContainer}>
                <Text style={{padding: 8, fontSize: 12, color: '#666'}}>
                  Found {addressPredictions.length} suggestions
                </Text>
                <FlatList
                  keyboardShouldPersistTaps="always"
                  data={addressPredictions}
                  keyExtractor={(item) => item.place_id}
                  style={styles.suggestionsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => onSelectPrediction(item)}
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
            onChangeText={(value) => updateFormData('city', value)}
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
            onChangeText={(value) => updateFormData('beneficiaryName', value)}
            error={errors.beneficiaryName}
            placeholder="Enter beneficiary's full name"
          />
          <Input
            label="Beneficiary Phone Number"
            value={formData.beneficiaryPhone}
            onChangeText={(value) => updateFormData('beneficiaryPhone', value)}
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
                  styles.input,
                  styles.addressInput,
                  errors.address && styles.inputError
                ]}
                value={addressQuery || formData.address}
                onChangeText={(value) => {
                  console.log('Address input changed (other):', value);
                  setAddressQuery(value);
                  fetchAutocomplete(value);
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
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
            
            {/* Address suggestions dropdown */}
            {addressPredictions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  keyboardShouldPersistTaps="always"
                  data={addressPredictions}
                  keyExtractor={(item) => item.place_id}
                  style={styles.suggestionsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => onSelectPrediction(item)}
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
            onChangeText={(value) => updateFormData('city', value)}
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
  );

  const renderBrandStep = () => {
    // Filter brands based on search query
    const filteredBrands = brands.filter(brand =>
      brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
    );

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Brand</Text>
        
        {/* Search Bar - Fixed */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for model (eg. iPhone 14)"
            value={brandSearchQuery}
            onChangeText={setBrandSearchQuery}
          />
        </View>

        {/* Brand Grid - Scrollable */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.brandGrid}
        >
          {filteredBrands.map((brand) => (
            <TouchableOpacity
              key={brand.id}
              style={[
                styles.brandItem,
                formData.selectedBrand === brand.name && styles.brandItemSelected,
              ]}
              onPress={() => {
                  console.log('Brand clicked:', brand.name, 'ID:', brand.id);
                  updateFormData('selectedBrand', brand.name);
                  
                  // Clear custom brand fields if selecting a regular brand
                  if (brand.name !== 'other') {
                    console.log('Clearing custom brand fields for:', brand.name);
                    updateFormData('customBrandName', '');
                    updateFormData('brand', brand.name);
                    setCustomBrand('');
                    console.log('Updated form data:', {
                      selectedBrand: brand.name,
                      brand: brand.name,
                      customBrandName: ''
                    });
                  }
                }}
            >
              {brand.img_url ? (
                <Image
                  source={{ uri: brand.img_url }}
                  style={{ width: 50, height: 50, marginBottom: spacing.xs }}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.otherBrandIcon}>
                  <Text style={styles.otherBrandIconText}>+</Text>
                </View>
              )}
              <Text style={[
                styles.brandName,
                formData.selectedBrand === brand.id && styles.brandNameSelected,
              ]}>
                {brand.name.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Custom Brand Input - Show when Other is selected */}
          {(() => {
            console.log('Checking if Other is selected:', formData.selectedBrand);
            console.log('Should show input?', formData.selectedBrand === 'other');
            return formData.selectedBrand === 'other';
          })() && (
            <View style={styles.customBrandContainer}>
              <Text style={styles.customBrandLabel}>Enter your brand name:</Text>
              <TextInput
                style={styles.customBrandInput}
                placeholder="Type your brand name"
                value={customBrand}
                onChangeText={(value) => {
                  console.log('Custom brand input changed:', value);
                  setCustomBrand(value);
                  updateFormData('customBrandName', value);
                  updateFormData('brand', value); // Also update the brand field
                  console.log('Updated form data:', {
                    ...formData,
                    customBrandName: value,
                    brand: value
                  });
                }}
              />
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  
  const renderModelStep = () => {
    // Filter models based on search query (reuse brand search for now)
    const filteredModels = models.filter(model =>
      model.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
    );

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Model</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for model (eg. MacBook Pro)"
            value={brandSearchQuery}
            onChangeText={setBrandSearchQuery}
          />
        </View>

        {/* Model Grid - FlatList */}
        <FlatList
          data={filteredModels}
          numColumns={1}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={1000}
          initialNumToRender={15}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 90,
            offset: 90 * index,
            index,
          })}
          renderItem={({ item: model }) => (
            <TouchableOpacity
              style={[
                styles.modelItem,
                formData.selectedModel === model.id && styles.brandItemSelected,
              ]}
              onPress={() => {
                  updateFormData('selectedModel', model.id);
                  updateFormData('model', model.name);
                }}
            >
                {model.url ? (
                  <>

                    {(() => {
                      return (
                        <LazyImage
                          source={{ uri: model.url }}
                          style={{ width: 60, height: 60, marginRight: spacing.md, resizeMode: 'contain' }}
                          onError={(error: any) => console.log('Image load error for', model.url, ':', error)}
                          onLoad={() => console.log('Image loaded successfully for', model.name)}
                          placeholder={<ActivityIndicator size="small" color="#666" />}
                        />
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <View style={[styles.otherBrandIcon, { marginRight: spacing.md }]}>
                      <Text style={styles.otherBrandIconText}>+</Text>
                    </View>
                  </>
                )}
                <Text style={[
                  styles.brandName,
                  formData.selectedModel === model.id && styles.brandNameSelected,
                ]}>
                  {model.name.toUpperCase()}
                </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.modelGrid}
        />
      </View>
    );
  };

  
  const renderProblemStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Do you know the problem?</Text>
      <View style={styles.optionsGrid}>
        {[
          { id: true, label: 'Yes, I know the problem' },
          { id: false, label: 'No, I need help identifying' },
        ].map((option) => (
          <TouchableOpacity
            key={option.id.toString()}
            style={[
              styles.optionButton,
              formData.knowsProblem === option.id && styles.optionButtonSelected,
            ]}
            onPress={() => updateFormData('knowsProblem', option.id)}
          >
            <Text
              style={[
                styles.optionText,
                formData.knowsProblem === option.id && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {formData.knowsProblem && (
        <>
          <Text style={styles.sectionTitle}>Problem Type</Text>
          <View style={styles.optionsGrid}>
            {problemCategories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.optionButton,
                  formData.problemType === category.value && styles.optionButtonSelected,
                ]}
                onPress={() => updateFormData('problemType', category.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.problemType === category.value && styles.optionTextSelected,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>
        {formData.knowsProblem ? 'Additional Details' : 'Describe the Problem'}
      </Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.problemDescription}
        onChangeText={(value) => updateFormData('problemDescription', value)}
        placeholder={
          formData.knowsProblem
            ? 'Please provide any additional details about your selected problem...'
            : "Please describe what's happening with your device..."
        }
        multiline
        textAlignVertical="top"
      />
      {errors.problemDescription && (
        <Text style={styles.errorText}>{errors.problemDescription}</Text>
      )}
    </View>
  );

  const renderDateTimeStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preferred Date</Text>
      <TextInput
        style={styles.input}
        value={formData.selectedDate || ''}
        onChangeText={(value) => updateFormData('selectedDate', value)}
        placeholder="Select date (YYYY-MM-DD)"
      />
      {errors.selectedDate && (
        <Text style={styles.errorText}>{errors.selectedDate}</Text>
      )}

      <Text style={styles.sectionTitle}>Preferred Time Slot</Text>
      <View style={styles.optionsGrid}>
        {TIME_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.optionButton,
              formData.selectedTimeSlot === slot.id && styles.optionButtonSelected,
            ]}
            onPress={() => updateFormData('selectedTimeSlot', slot.id)}
          >
            <Text
              style={[
                styles.optionText,
                formData.selectedTimeSlot === slot.id && styles.optionTextSelected,
              ]}
            >
              {slot.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.selectedTimeSlot && (
        <Text style={styles.errorText}>{errors.selectedTimeSlot}</Text>
      )}
    </View>
  );

  const renderImagesStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upload Images (Optional)</Text>
      <Text style={styles.subtitle}>
        Add photos showing the issue (up to 5 images)
      </Text>
      <TouchableOpacity
        style={[
          styles.input,
          { justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
        ]}
        onPress={() => {
          // TODO: Implement image picker
          Alert.alert('Info', 'Image picker will be implemented');
        }}
      >
        <Text style={styles.optionText}>+ Add Images</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Review Your Request</Text>
      
      <View style={[styles.input, { marginBottom: spacing.md }]}>
        <Text style={styles.optionText}>
          Request Type: {formData.requestType === 'self' ? 'For Myself' : 'For Someone Else'}
        </Text>
      </View>

      <View style={[styles.input, { marginBottom: spacing.md }]}>
        <Text style={styles.optionText}>
          Service Type: {formData.serviceType.replace('-', ' ')}
        </Text>
      </View>

      <View style={[styles.input, { marginBottom: spacing.md }]}>
        <Text style={styles.optionText}>
          Device: {formData.brand} - {formData.model}
        </Text>
      </View>

      <View style={[styles.input, { marginBottom: spacing.md }]}>
        <Text style={styles.optionText}>
          Location: {formData.address}, {formData.city}
        </Text>
      </View>

      {formData.knowsProblem && (
        <View style={[styles.input, { marginBottom: spacing.md }]}>
          <Text style={styles.optionText}>
            Problem: {problemCategories.find(c => c.value === formData.problemType)?.label || formData.problemType}
          </Text>
        </View>
      )}

      <View style={[styles.input, { marginBottom: spacing.md }]}>
        <Text style={styles.optionText}>
          Description: {formData.problemDescription}
        </Text>
      </View>

      {formData.selectedDate && formData.selectedTimeSlot && (
        <View style={[styles.input, { marginBottom: spacing.md }]}>
          <Text style={styles.optionText}>
            Date & Time: {formData.selectedDate} - {TIME_SLOTS.find(s => s.id === formData.selectedTimeSlot)?.label}
          </Text>
        </View>
      )}

      {calculatedPricing && (
        <View style={[styles.input, { marginBottom: spacing.md }]}>
          <Text style={styles.optionText}>
            Price Range: ₹{calculatedPricing.finalChargeRange.min} - ₹{calculatedPricing.finalChargeRange.max}
          </Text>
        </View>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderContactStep();
      case 1:
        return renderBrandStep();
      case 2:
        return renderModelStep();
      case 3:
        return renderProblemStep();
      case 4:
        return renderDateTimeStep();
      case 5:
        return renderImagesStep();
      case 6:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentStep + 1}/{STEPS.length} {STEPS[currentStep]?.title}
          </Text>
          <View style={styles.backButton} />
        </View>

        
          {/* Step Indicator */}
          {/* <View style={styles.stepIndicator}>
            {STEPS.map((step, index) => (
              <View key={step.id} style={{ alignItems: 'center' }}>
                <View
                  style={[
                    styles.stepDot,
                    index <= currentStep && styles.stepDotActive,
                    index < currentStep && styles.stepDotCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepText,
                      index <= currentStep && styles.stepTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepText, { fontSize: 10, marginTop: 4 }]}>
                  {step.title}
                </Text>
              </View>
            ))}
          </View> */}

          {/* Current Step Content */}
          {currentStep === 2 ? (
            // Model step - use flex layout to show navigation buttons
            <View style={{ flex: 1, flexDirection: 'column' }}>
              <View style={{ flex: 1 }}>
                {renderCurrentStep()}
              </View>
            </View>
          ) : (
            // Other steps - wrap with ScrollView
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {renderCurrentStep()}
            </ScrollView>
          )}
          

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentStep > 0 ? (
              <Button
                title="Back"
                onPress={prevStep}
                variant="outline"
              />
            ) : (
              <View />
            )}

            {currentStep < STEPS.length - 1 ? (
              <Button
                title="Continue"
                onPress={nextStep}
              />
            ) : (
              <Button
                title={isSubmitting ? 'Submitting...' : 'Submit Request'}
                onPress={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
              />
            )}
          </View>
      </View>
    </SafeAreaProvider>
  );
}

