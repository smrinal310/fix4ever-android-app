import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, Alert,
  PermissionsAndroid,
  Platform,

 } from 'react-native';
//import { createStackNavigator } from '@react-navigation/stack';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { request, requestWithAuth } from '../../core/api';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';

import { config } from '../../core/config';
const base = config.API_BASE_URL;

import { getStoredToken } from '../../core/storage';

// Response interface for service request creation
interface ServiceRequestResponse {
  success: boolean;
  message?: string;
  data?: any;
}

import {
  ContactStepScreen,
  BrandStepScreen,
  ModelStepScreen,
  ProblemStepScreen,
  DateTimeStepScreen,
  ImagesStepScreen,
  ReviewStepScreen,
} from './steps';
import { Button } from '../../core/components';
import { useTheme } from '../../core/theme';
import { useAuth } from '../../lib/contexts/auth-context';

export interface FormData {
  requestType: "self" | 'other';
  serviceType: "pickup-drop" | 'visit-shop' | 'onsite';
  userName: string;
  userPhone: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  knowsProblem: boolean;
  problemType: string;
  issueLevel: any;
  problemDescription: string;
  warrantyOption: 'none' | '30days' | '3months';
  urgencyLevel: 'normal' | 'express' | 'urgent';
  dataSafety: boolean;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
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
  mainProblem: Record<string, string>;
  subProblem: Record<string, string>;
  relationalBehaviors: Record<string, string>[];
}

const DEVICE_TYPES = ['Laptop'];
// Issue level interface
interface IssueLevel {
  id: string;
  name: string;
  description: string;
  price: number;
}


interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

interface ServiceRequestStackProps {
  // updateFormData: (field: keyof FormData, value: any) => void;
  // addressQuery: string;
  // setAddressQuery: (value: string) => void;
  // addressPredictions: any[];
  // fetchAutocomplete: (value: string) => void;
  // loadingAddress: boolean;
  // calculatedPricing: any;
  navigation: any;
}

const Stack = createNativeStackNavigator();

// TIME_SLOTS constant for time slot selection
const TIME_SLOTS = [
  { id: '09:00-12:00', label: '9:00 AM - 12:00 PM' },
  { id: '12:00-15:00', label: '12:00 PM - 3:00 PM' },
  { id: '15:00-18:00', label: '3:00 PM - 6:00 PM' },
];

// Helper function to get step index from route name
const getStepIndex = (routeName: string): number => {
  const steps = ['Contact', 'Brand', 'Model', 'Problem', 'DateTime', 'Images', 'Review'];
  return steps.indexOf(routeName);
};

// STEPS constant for header titles
const STEPS = [
  { id: 'contact', title: 'Contact & Request' },
  { id: 'brand', title: 'Brand' },
  { id: 'model', title: 'Model' },
  { id: 'problem', title: 'Problem' },
  { id: 'datetime', title: 'Date & Time' },
  { id: 'images', title: 'Images' },
  { id: 'review', title: 'Review' },
];

// Custom Header Component
const StepHeader = ({ navigation, routeName }: { navigation: any; routeName: string }) => {
  const { colors, spacing } = useTheme();
  const stepIndex = getStepIndex(routeName);
  const title = `${stepIndex + 1}/7 ${STEPS[stepIndex]?.title || 'Service Request'}`;
  
  return (
    <View style={{
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginRight: spacing.md }}
      >
        <Text style={{ color: colors.foreground, fontSize: 24 }}>←</Text>
      </TouchableOpacity>
      <Text style={{
        fontSize: 18,
        fontWeight: '600' as const,
        color: colors.foreground,
        flex: 1,
      }}>
        {title}
      </Text>
      <View style={{ width: 32 }} />
    </View>
  );
};

export function ServiceRequestStack({
  // addressQuery,
  // setAddressQuery,
  // addressPredictions,
  // fetchAutocomplete,
  // loadingAddress,
  // calculatedPricing,
  navigation,
}: ServiceRequestStackProps) {
  const { colors, spacing } = useTheme();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // search query state
  const [searchQuery, setSearchQuery] = useState('');
  const [customBrand, setCustomBrand] = useState('');


  // Location states
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);


  // Address autocomplete state
  const [addressQuery, setAddressQuery] = useState('');
  const [addressPredictions, setAddressPredictions] = useState<any[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
      // Enhanced user contact and request details
      requestType: 'self' as "self" | 'other',
      serviceType: 'pickup-drop' as "pickup-drop" | 'visit-shop' | 'onsite',
      userName: user?.username || '',
      userPhone: user?.phone || '',
      beneficiaryName: '',
      beneficiaryPhone: '',
      // Problem knowledge fields
      knowsProblem: true as boolean,
      problemType: '',
      issueLevel: { id: 'moderate', name: 'Moderate', description: '', price: 500 } as IssueLevel,
      problemDescription: '',
      // Warranty and urgency
      warrantyOption: 'none' as 'none' | '30days' | '3months',
      urgencyLevel: 'normal' as 'normal' | 'express' | 'urgent',
      dataSafety: true as boolean,
      // Date and time
      selectedDate: "" as string | null,
      selectedTimeSlot: "" as string | null,
      preferredDate: "" as string | null,
      preferredTime: "" as string | null,
      // Location
      address: '',
      latitude: 1,
      longitude: 1,
      city: '',
      // Device details
      brand: '',
      model: '',
      issueImages: [] as File[],
      selectedBrand: '',
      deviceType: 'Laptop',
      customBrandName: '',
      selectedModel: '',
      mainProblem: {},
      subProblem: {},
      relationalBehaviors: []
    });



    
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

    // Helper functions
      const updateFormData = useCallback((field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
            model.id = index.toString();
            return model;
          })
          setModels(models);
        } else {
          console.log('Models API error:', response.data);
        }

      } catch (error) {
        setError('Failed to fetch models request');
      } finally {
        setLoading(false);
      }
    }


  // Location permission and geolocation
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        Geolocation.requestAuthorization(
          (success: any) => resolve(success === 'granted' || success === 'always'),
          (error: any) => {
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
            title: 'Location Access Required',
            message: 'This app needs to access your location to provide better service.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
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
      
      // Mock address and city based on coordinates (replace with actual geocoding)
      const mockAddress = `Location detected at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      const mockCity = 'Detected City';
      // updateFormData('address', mockAddress);
      // updateFormData('city', mockCity);
      
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

  // Validation
  const validateCurrentStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      // Basic validation for Contact step (step 0)
      if (!formData.requestType) {
        newErrors.requestType = 'Please select request type';
      }
      if (!formData.serviceType) {
        newErrors.serviceType = 'Please select service type';
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
    }
    else if(stepIndex === 1) {
      if (formData.brand === "") {
        newErrors.brand = 'Brand is required';
      }
    }
    else if (stepIndex === 2) {
      if (formData.model === "") {
        newErrors.model = 'Model is required';
      }
    }
    else if (stepIndex === 3) {
      if (formData.knowsProblem) {
        if (!formData.mainProblem?.title) {
          newErrors.mainProblem = 'Main problem is required';
        }
        if (!formData.subProblem?.title) {
          newErrors.subProblem = 'Sub problem is required';
        }
        if (!formData.relationalBehaviors[0]) {
          newErrors.relationalBehaviors = 'Relational behavior is required';
        }
      }
      else if (!formData.knowsProblem) {
        if (formData.problemDescription === "") {
          newErrors.problemDescription = 'Problem description is required';
        }
      }
    }
    else if (stepIndex === 4) {
      if (!formData.preferredDate) {
        newErrors.preferredDate = 'Preferred date is required';
      }
      if (!formData.preferredTime) {
        newErrors.preferredTime = 'Preferred time is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const nextStep = (currentNavigation: any) => {
    const currentRoute = currentNavigation.getState();
    const stepIndex = getStepIndex(currentRoute.routes[currentRoute.index].name);
    if (validateCurrentStep(stepIndex)) {
        if (stepIndex === 0) {
          getAllBrands();
        }
        if (stepIndex === 1) {
          getBrandModels();
        }
        
        const nextStepName = getNextStepName(stepIndex);
        if (nextStepName) {
          currentNavigation.navigate(nextStepName);
        }

        setSearchQuery("");
    } else {
        Alert.alert('Error', 'Please fill in all required fields');
    }
  };

  const prevStep = (currentNavigation: any) => {
    setSearchQuery("");
    if (currentNavigation.canGoBack()) {
      currentNavigation.goBack();
    }
  };

  const getNextStepName = (currentIndex: number): string => {
    const steps = ['Contact', 'Brand', 'Model', 'Problem', 'DateTime', 'Images', 'Review'];
    return steps[currentIndex + 1] || 'Review';
  };

  const getStepTitle = (route: any): string => {
    const stepIndex = route.state?.index || 0;
    const titles = [
      '1/7 Contact & Request',
      '2/7 Brand',
      '3/7 Model', 
      '4/7 Problem',
      '5/7 Date & Time',
      '6/7 Images',
      '7/7 Review'
    ];
    return titles[stepIndex] || 'Service Request';
  };

  const canGoBack = (route: any): boolean => {
    const stepIndex = route.state?.index || 0;
    return stepIndex > 0;
  };

  const canGoForward = (route: any): boolean => {
    const stepIndex = route.state?.index || 0;
    return stepIndex < 6;
  };

    // Helper function to convert React Native file URIs to blobs
  // const convertFilesToBlobs = async (files: File[]): Promise<File[]> => {
  //   const blobFiles: File[] = [];
    
  //   for (const file of files) {
  //     try {
  //       // For React Native, fetch the URI to get actual blob data
  //       const response = await fetch((file as any).uri);
  //       const blob = await response.blob();
        
  //       // Create a proper File object with blob data
  //       const blobFile = new File([blob], file.name, { type: file.type });
  //       blobFiles.push(blobFile);
  //     } catch (error) {
  //       console.error('Error converting file to blob:', file.name, error);
  //     }
  //   }
    
  //   return blobFiles;
  // };

    // Form submission
    const handleSubmit = async (currentNavigation: any) => {
      const currentRoute = currentNavigation.getState();
      const stepIndex = getStepIndex(currentRoute.routes[currentRoute.index].name);
      if (!validateCurrentStep(stepIndex)) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
  
      setIsSubmitting(true);
      setError(null);
  
      try {
        const token = await getStoredToken();

        // Create FormData object
        const formDataObj = new FormData();

        // Append all form fields except images
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== 'issueImages' && value !== undefined && value !== null) {
            // These specific fields need to be JSON strings
            if (key === 'mainProblem' || key === 'subProblem' || key === 'relationalBehaviors') {
              formDataObj.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              formDataObj.append(key, JSON.stringify(value));
            } else {
              formDataObj.append(key, value.toString());
            }
          }
        });

        // Append image files to FormData
        // Format: { uri: local path, type: mime type, name: filename }
        if (formData.issueImages.length > 0) {
          formData.issueImages.forEach((file: any, index: number) => {
            formDataObj.append('issueImages', {
              uri: file.uri,
              type: file.type || 'image/jpeg', // Fallback to jpeg if type unknown
              name: file.name || `upload-${Date.now()}.jpg`, // Unique filename
            });
          });
        }

        const resp = await axios.post(`${base}/service-requests/create`, formDataObj, {  
          headers: {  
            'Content-Type': 'multipart/form-data', // Critical for file uploads 
            Authorization: `Bearer ${token}` 
          },
        });  
        if (resp?.data?.success) {
          Alert.alert('Success', 'Service request submitted successfully!');
          navigation.goBack();
        } else {
          Alert.alert('Error', resp?.data?.message || 'Failed to submit request');
        }
      } catch (error) {
        console.error('Submission error:', error);
        setError('Failed to submit request');
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Contact">
        {(props) => (
          <View style={{ flex: 1 }}>
            <StepHeader navigation={props.navigation} routeName="Contact" />
            <ContactStepScreen
              {...props}
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onNext={() => nextStep(props.navigation)}
              onBack={() => prevStep(props.navigation)}
              addressQuery={addressQuery}
              setAddressQuery={setAddressQuery}
              addressPredictions={addressPredictions}
              fetchAutocomplete={fetchAutocomplete}
              
              loadingAddress={loadingAddress}
              getCurrentLocation={getCurrentLocation}
              isGettingLocation={isGettingLocation}
              locationError={locationError}
            />
            <NavigationFooter
              canGoBack={false}
              canGoForward={true}
              onBack={() => prevStep(props.navigation)}
              onNext={() => nextStep(props.navigation)}
              isSubmitting={false}
              isLastStep={false}
            />
          </View>
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Brand">
        {(props) => (
          <View style={{ flex: 1 }}>
            <StepHeader navigation={props.navigation} routeName="Brand" />
            <BrandStepScreen
              {...props}
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onNext={() => nextStep(props.navigation)}
              onBack={() => prevStep(props.navigation)}
              brands={brands}
              brandSearchQuery={searchQuery}
              setBrandSearchQuery={setSearchQuery}
              customBrand={customBrand}
              setCustomBrand={setCustomBrand}
            />
            <NavigationFooter
              canGoBack={true}
              canGoForward={true}
              onBack={() => prevStep(props.navigation)}
              onNext={() => nextStep(props.navigation)}
              isSubmitting={false}
              isLastStep={false}
            />
          </View>
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Model">
        {(props) => (
          <View style={{ flex: 1 }}>
            <StepHeader navigation={props.navigation} routeName="Model" />
            <ModelStepScreen
              {...props}
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onNext={() => nextStep(props.navigation)}
              onBack={() => prevStep(props.navigation)}
              models={models}
              modelSearchQuery={searchQuery}
              setModelSearchQuery={setSearchQuery}
            />
            <NavigationFooter
              canGoBack={true}
              canGoForward={true}
              onBack={() => prevStep(props.navigation)}
              onNext={() => nextStep(props.navigation)}
              isSubmitting={false}
              isLastStep={false}
            />
          </View>
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Problem">
        {(props) => (
          <View style={{ flex: 1 }}>
            <StepHeader navigation={props.navigation} routeName="Problem" />
            <ProblemStepScreen
              {...props}
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onNext={() => nextStep(props.navigation)}
              onBack={() => prevStep(props.navigation)}
            />
            <NavigationFooter
              canGoBack={true}
              canGoForward={true}
              onBack={() => prevStep(props.navigation)}
              onNext={() => nextStep(props.navigation)}
              isSubmitting={false}
              isLastStep={false}
            />
          </View>
        )}
      </Stack.Screen>

      <Stack.Screen name="DateTime">
        {(props) => (
          <View style={{ flex: 1 }}>
            <StepHeader navigation={props.navigation} routeName="DateTime" />
            <DateTimeStepScreen
              {...props}
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onNext={() => nextStep(props.navigation)}
              onBack={() => prevStep(props.navigation)}
            />
            <NavigationFooter
              canGoBack={true}
              canGoForward={true}
              onBack={() => prevStep(props.navigation)}
              onNext={() => nextStep(props.navigation)}
              isSubmitting={false}
              isLastStep={false}
            />
          </View>
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Images">
        {(props) => (
          <View style={{ flex: 1 }}>
            <StepHeader navigation={props.navigation} routeName="Images" />
            <ImagesStepScreen
              {...props}
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onNext={() => nextStep(props.navigation)}
              onBack={() => prevStep(props.navigation)}
            />
            <NavigationFooter
              canGoBack={true}
              canGoForward={true}
              onBack={() => prevStep(props.navigation)}
              onNext={() => nextStep(props.navigation)}
              isSubmitting={false}
              isLastStep={false}
            />
          </View>
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Review">
        {(props) => (
          <View style={{ flex: 1 }}>
            <StepHeader navigation={props.navigation} routeName="Review" />
            <ReviewStepScreen
              {...props}
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onNext={() => handleSubmit(props.navigation)}
              onBack={() => prevStep(props.navigation)}
              calculatedPricing={calculatedPricing}
              problemCategories={[]}
              TIME_SLOTS={TIME_SLOTS}
            />
            <NavigationFooter
              canGoBack={true}
              canGoForward={true}
              onBack={() => prevStep(props.navigation)}
              onNext={() => handleSubmit(props.navigation)}
              isSubmitting={isSubmitting}
              isLastStep={true}
            />
          </View>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Navigation Footer Component
function NavigationFooter({
  canGoBack,
  canGoForward,
  onBack,
  onNext,
  isSubmitting,
  isLastStep,
}: {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
}) {
  const { colors, spacing } = useTheme();

  return (
    <View style={{
      flexDirection: 'row' as const,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.md,
    }}>
      {canGoBack ? (
        <Button
          title="Back"
          onPress={onBack}
          variant="outline"
          style={{ flex: 1 }}
        />
      ) : (
        <View style={{ flex: 1 }} />
      )}
      
      {canGoForward ? (
        <Button
          title="Continue"
          onPress={onNext}
          style={{ flex: 1 }}
        />
      ) : (
        <Button
          title={isSubmitting ? 'Submitting...' : 'Submit Request'}
          onPress={onNext}
          disabled={isSubmitting}
          loading={isSubmitting}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
}
