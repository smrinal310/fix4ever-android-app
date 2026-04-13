import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../core/theme';

interface ServiceStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'in-progress' | 'pending';
  completedAt?: Date;
  estimatedTime?: string;
  actualTime?: string;
}

interface RealTimeServiceTrackerProps {
  serviceRequest: any;
  serviceType: 'pickup-drop' | 'visit-shop' | 'onsite';
}

export default function RealTimeServiceTracker({
  serviceRequest,
  serviceType,
}: RealTimeServiceTrackerProps) {
  const { colors, typography, spacing } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [steps, setSteps] = useState<ServiceStep[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progressWidth] = useState(new Animated.Value(0));

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Animate progress bar when steps change
  useEffect(() => {
    const completedPercentage = (steps.filter((s: ServiceStep) => s.status === 'completed').length / steps.length) * 100;
    Animated.timing(progressWidth, {
      toValue: completedPercentage,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [steps]);

  // Calculate steps based on service type and current status
  useEffect(() => {
    if (!serviceRequest) return;

    const status = serviceRequest.status;
    const createdAt = new Date(serviceRequest.createdAt);
    const acceptedAt = serviceRequest.acceptedAt ? new Date(serviceRequest.acceptedAt) : null;

    if (serviceType === 'pickup-drop') {
      // Check if pricing was rejected (no repair happened, just return device)
      const pricingRejected =
        serviceRequest.problemIdentification?.customerApproval?.status === 'rejected';

      if (pricingRejected) {
        // Simplified flow when customer rejected pricing - skip repair steps, go straight to return
        const rejectedPickupSteps: ServiceStep[] = [
          {
            id: 'request-created',
            title: 'Request Placed',
            description: 'Your service request has been created',
            icon: <Icon name="package" size={20} color="#FFFFFF" />,
            status: 'completed',
            completedAt: createdAt,
            estimatedTime: '0 min',
          },
          {
            id: 'assigned',
            title: 'Technician Assigned',
            description: 'A technician has accepted your request',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status: status === 'Pending' ? 'pending' : 'completed',
            completedAt: acceptedAt || undefined,
            estimatedTime: '5-10 min',
            actualTime: acceptedAt ? calculateTimeDiff(createdAt, acceptedAt) : undefined,
          },
          {
            id: 'pickup-initiated',
            title: 'Pickup Initiated',
            description: 'Captain is on the way to pickup',
            icon: <Icon name="truck" size={20} color="#FFFFFF" />,
            status: status === 'Pickup Initiated'
              ? 'in-progress'
              : [
                  'Captain Reached Customer',
                  'Pickup Done',
                  'Handover to Vendor',
                  'Device Received',
                  'Problem Verification',
                  'Repair',
                  'Repair Done',
                  'Drop Initiated',
                  'Delivered',
                  'Completed',
                ].includes(status)
              ? 'completed'
              : 'pending',
            completedAt: serviceRequest.pickupDetails?.actualPickupTime
              ? new Date(serviceRequest.pickupDetails.actualPickupTime)
              : undefined,
            estimatedTime: '30-60 min',
          },
          {
            id: 'device-received',
            title: 'Device Received at Shop',
            description: 'Device has been delivered to the shop',
            icon: <Icon name="package" size={20} color="#FFFFFF" />,
            status: 'completed',
            estimatedTime: '30-60 min',
          },
          {
            id: 'verification',
            title: 'Problem Identified',
            description: 'Problem was diagnosed and pricing was provided',
            icon: <Icon name="eye" size={20} color="#FFFFFF" />,
            status: 'completed',
            estimatedTime: '30 min - 2 hours',
          },
          {
            id: 'pricing-rejected',
            title: 'Pricing Declined',
            description: 'Pricing was declined. Device is being returned without repair.',
            icon: <Icon name="package" size={20} color="#FFFFFF" />,
            status: 'completed',
          },
          {
            id: 'drop-initiated',
            title: 'Delivery Started',
            description: 'Your device is on the way back',
            icon: <Icon name="truck" size={20} color="#FFFFFF" />,
            status:
              status === 'Drop Initiated' || status === 'Captain Reached Vendor'
                ? 'in-progress'
                : ['Handover to Captain', 'Captain Pickup Done', 'Delivered', 'Completed'].includes(
                      status
                    )
                  ? 'completed'
                  : status === 'Drop Requested'
                    ? 'pending'
                    : 'pending',
            estimatedTime: '30-60 min',
          },
          {
            id: 'delivered',
            title: 'Delivered',
            description: 'Your device has been returned',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status: ['Delivered', 'Completed'].includes(status) ? 'completed' : 'pending',
            completedAt: serviceRequest.completedAt
              ? new Date(serviceRequest.completedAt)
              : undefined,
          },
        ];
        setSteps(rejectedPickupSteps);
      } else {
        // Normal pickup-drop flow (including unknown problem identification statuses)
        const pickupSteps: ServiceStep[] = [
          {
            id: 'request-created',
            title: 'Request Placed',
            description: 'Your service request has been created',
            icon: <Icon name="package" size={20} color="#FFFFFF" />,
            status: 'completed',
            completedAt: createdAt,
            estimatedTime: '0 min',
          },
          {
            id: 'assigned',
            title: 'Technician Assigned',
            description: 'A technician has accepted your request',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status: status === 'Pending' ? 'pending' : 'completed',
            completedAt: acceptedAt || undefined,
            estimatedTime: '5-10 min',
            actualTime: acceptedAt ? calculateTimeDiff(createdAt, acceptedAt) : undefined,
          },
          {
            id: 'pickup-initiated',
            title: 'Pickup Initiated',
            description: 'Captain is on the way to pickup',
            icon: <Icon name="truck" size={20} color="#FFFFFF" />,
            status:
              status === 'Pickup Initiated'
                ? 'in-progress'
                : [
                      'Captain Reached Customer',
                      'Pickup Done',
                      'Captain Reached Vendor (Pickup)',
                      'Handover to Vendor',
                      'Device Received',
                      'Problem Verification',
                      'Problem Identification',
                      'Identification Done',
                      'Admin Review Pending',
                      'Customer Approval Pending',
                      'Repair',
                      'Repair Started',
                      'Repair Done',
                      'Drop Initiated',
                      'Drop Requested',
                      'Captain Reached Vendor',
                      'Handover to Captain',
                      'Captain Pickup Done',
                      'Delivered',
                      'Completed',
                    ].includes(status) ||
                    serviceRequest?.captainPickupRequest?.status === 'completed'
                  ? 'completed'
                  : 'pending',
            completedAt: serviceRequest.pickupDetails?.actualPickupTime
              ? new Date(serviceRequest.pickupDetails.actualPickupTime)
              : undefined,
            estimatedTime: '30-60 min',
          },
          {
            id: 'captain-reached-customer',
            title: 'Captain Reached Customer',
            description: 'Captain has arrived at your location',
            icon: <Icon name="map-pin" size={20} color="#FFFFFF" />,
            status:
              [
                'Pickup Done',
                'Captain Reached Vendor (Pickup)',
                'Handover to Vendor',
                'Device Received',
                'Problem Verification',
                'Problem Identification',
                'Identification Done',
                'Admin Review Pending',
                'Customer Approval Pending',
                'Repair',
                'Repair Started',
                'Repair Done',
                'Drop Initiated',
                'Drop Requested',
                'Captain Reached Vendor',
                'Handover to Captain',
                'Captain Pickup Done',
                'Delivered',
                'Completed',
              ].includes(status) ||
              serviceRequest?.captainPickupRequest?.status === 'pickup_done' ||
              serviceRequest?.captainPickupRequest?.status === 'reached_vendor' ||
              serviceRequest?.captainPickupRequest?.status === 'handover_to_vendor' ||
              serviceRequest?.captainPickupRequest?.status === 'completed'
                ? 'completed'
                : status === 'Captain Reached Customer' ||
                    serviceRequest?.captainPickupRequest?.status === 'reached_customer'
                  ? 'in-progress'
                  : 'pending',
            estimatedTime: '5-10 min',
          },
          {
            id: 'pickup-done',
            title: 'Device Picked Up',
            description: 'Your device has been picked up',
            icon: <Icon name="check-square" size={20} color="#FFFFFF" />,
            status:
              [
                'Captain Reached Vendor (Pickup)',
                'Handover to Vendor',
                'Device Received',
                'Problem Verification',
                'Problem Identification',
                'Identification Done',
                'Admin Review Pending',
                'Customer Approval Pending',
                'Repair',
                'Repair Started',
                'Repair Done',
                'Drop Initiated',
                'Drop Requested',
                'Captain Reached Vendor',
                'Handover to Captain',
                'Captain Pickup Done',
                'Delivered',
                'Completed',
              ].includes(status) ||
              serviceRequest?.captainPickupRequest?.status === 'reached_vendor' ||
              serviceRequest?.captainPickupRequest?.status === 'handover_to_vendor' ||
              serviceRequest?.captainPickupRequest?.status === 'completed'
                ? 'completed'
                : status === 'Pickup Done' ||
                    serviceRequest?.captainPickupRequest?.status === 'pickup_done'
                  ? 'in-progress'
                  : 'pending',
            estimatedTime: '1-3 hours',
          },
          {
            id: 'device-received',
            title: 'Device Received at Shop',
            description: 'Device has been delivered to the shop',
            icon: <Icon name="package" size={20} color="#FFFFFF" />,
            status:
              [
                'Problem Verification',
                'Problem Identification',
                'Identification Done',
                'Admin Review Pending',
                'Customer Approval Pending',
                'Repair',
                'Repair Started',
                'Repair Done',
                'Drop Initiated',
                'Drop Requested',
                'Captain Reached Vendor',
                'Handover to Captain',
                'Captain Pickup Done',
                'Delivered',
                'Completed',
              ].includes(status) || serviceRequest?.captainPickupRequest?.status === 'completed'
                ? 'completed'
                : status === 'Device Received' || status === 'Handover to Vendor'
                  ? 'in-progress'
                  : 'pending',
            estimatedTime: '30-60 min',
          },
          {
            id: 'verification',
            title: 'Problem Verification',
            description: 'Technician is diagnosing the issue',
            icon: <Icon name="eye" size={20} color="#FFFFFF" />,
            status: [
              'Problem Verification',
              'Problem Identification',
              'Identification Done',
              'Admin Review Pending',
              'Customer Approval Pending',
            ].includes(status)
              ? 'in-progress'
              : [
                    'Repair Started',
                    'Repair',
                    'Repair Done',
                    'Drop Initiated',
                    'Drop Requested',
                    'Captain Reached Vendor',
                    'Handover to Captain',
                    'Captain Pickup Done',
                    'Delivered',
                    'Completed',
                  ].includes(status)
                ? 'completed'
                : 'pending',
            estimatedTime: '30 min - 2 hours',
          },
          {
            id: 'repair',
            title: 'Repair In Progress',
            description: 'Your device is being repaired',
            icon: <Icon name="tool" size={20} color="#FFFFFF" />,
            status:
              status === 'Repair Started' || status === 'Repair'
                ? 'in-progress'
                : [
                      'Repair Done',
                      'Drop Initiated',
                      'Drop Requested',
                      'Captain Reached Vendor',
                      'Handover to Captain',
                      'Captain Pickup Done',
                      'Delivered',
                      'Completed',
                    ].includes(status)
                  ? 'completed'
                  : 'pending',
            estimatedTime: '2-4 hours',
          },
          {
            id: 'repair-done',
            title: 'Repair Completed',
            description: 'Your device has been repaired',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status:
              status === 'Repair Done'
                ? 'in-progress'
                : [
                      'Drop Initiated',
                      'Drop Requested',
                      'Captain Reached Vendor',
                      'Handover to Captain',
                      'Captain Pickup Done',
                      'Delivered',
                      'Completed',
                    ].includes(status)
                  ? 'completed'
                  : 'pending',
            estimatedTime: '30 min - 1 hour',
          },
          {
            id: 'drop-initiated',
            title: 'Delivery Started',
            description: 'Your device is on the way back',
            icon: <Icon name="truck" size={20} color="#FFFFFF" />,
            status:
              status === 'Drop Initiated' || status === 'Captain Reached Vendor'
                ? 'in-progress'
                : ['Handover to Captain', 'Captain Pickup Done', 'Delivered', 'Completed'].includes(
                      status
                    )
                  ? 'completed'
                  : 'pending',
            estimatedTime: '30-60 min',
          },
          {
            id: 'delivered',
            title: 'Delivered',
            description: 'Your device has been delivered',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status: ['Delivered', 'Completed'].includes(status) ? 'completed' : 'pending',
            completedAt: serviceRequest.completedAt
              ? new Date(serviceRequest.completedAt)
              : undefined,
          },
        ];
        setSteps(pickupSteps);
      }
    } else if (serviceType === 'visit-shop') {
      // Visit shop steps
      const shopSteps: ServiceStep[] = [
        {
          id: 'request-created',
          title: 'Request Placed',
          description: 'Your service request has been created',
          icon: <Icon name="package" size={20} color="#FFFFFF" />,
          status: 'completed',
          completedAt: createdAt,
          estimatedTime: '0 min',
        },
        {
          id: 'assigned',
          title: 'Technician Assigned',
          description: 'A technician has accepted your request',
          icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
          // Show as completed when status is 'Assigned' or any later status
          // Only show as pending if status is still 'Pending'
          status: status === 'Pending' ? 'pending' : 'completed',
          completedAt: acceptedAt || undefined,
          estimatedTime: '5-10 min',
        },
        {
          id: 'arrived-at-shop',
          title: 'Arrived at Shop',
          description: 'You have arrived at the service center',
          icon: <Icon name="map-pin" size={20} color="#FFFFFF" />,
          status:
            status === 'Arrived at Shop'
              ? 'in-progress'
              : [
                    'Device Received',
                    'Problem Verification',
                    'Repair',
                    'Repair Done',
                    'Drop Requested',
                    'Drop Initiated',
                    'Captain Reached Vendor',
                    'Handover to Captain',
                    'Captain Pickup Done',
                    'Device Delivered',
                    'Completed',
                  ].includes(status)
                ? 'completed'
                : 'pending',
          estimatedTime: 'Variable',
        },
        {
          id: 'device-received',
          title: 'Device Received',
          description: 'Your device has been received',
          icon: <Icon name="check-square" size={20} color="#FFFFFF" />,
          status:
            status === 'Device Received'
              ? 'in-progress'
              : [
                    'Problem Verification',
                    'Repair',
                    'Repair Done',
                    'Drop Requested',
                    'Drop Initiated',
                    'Captain Reached Vendor',
                    'Handover to Captain',
                    'Captain Pickup Done',
                    'Device Delivered',
                    'Completed',
                  ].includes(status)
                ? 'completed'
                : 'pending',
          estimatedTime: '1-3 hours',
        },
        {
          id: 'verification',
          title: 'Problem Verification',
          description: 'Technician is diagnosing the issue',
          icon: <Icon name="eye" size={20} color="#FFFFFF" />,
          status:
            status === 'Problem Verification'
              ? 'in-progress'
              : [
                    'Repair',
                    'Repair Done',
                    'Drop Requested',
                    'Drop Initiated',
                    'Captain Reached Vendor',
                    'Handover to Captain',
                    'Captain Pickup Done',
                    'Device Delivered',
                    'Completed',
                  ].includes(status)
                ? 'completed'
                : 'pending',
          estimatedTime: '30 min - 2 hours',
        },
        {
          id: 'repair',
          title: 'Repair In Progress',
          description: 'Your device is being repaired',
          icon: <Icon name="tool" size={20} color="#FFFFFF" />,
          status:
            status === 'Repair'
              ? 'in-progress'
              : [
                    'Repair Done',
                    'Drop Requested',
                    'Drop Initiated',
                    'Captain Reached Vendor',
                    'Handover to Captain',
                    'Captain Pickup Done',
                    'Device Delivered',
                    'Completed',
                  ].includes(status)
                ? 'completed'
                : 'pending',
          estimatedTime: '2-4 hours',
        },
        {
          id: 'repair-done',
          title: 'Repair Completed',
          description: 'Your device is ready for pickup',
          icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
          status:
            status === 'Repair Done'
              ? 'in-progress'
              : [
                    'Drop Requested',
                    'Drop Initiated',
                    'Captain Reached Vendor',
                    'Handover to Captain',
                    'Captain Pickup Done',
                    'Device Delivered',
                    'Completed',
                  ].includes(status)
                ? 'completed'
                : 'pending',
          estimatedTime: '30 min - 1 hour',
        },
      ];
      setSteps(shopSteps);
    } else {
      // Onsite steps
      // Check if pricing was rejected (no repair happened)
      const pricingRejected =
        serviceRequest.problemIdentification?.customerApproval?.status === 'rejected';

      if (pricingRejected) {
        // Simplified flow when customer rejected pricing - no repair steps
        const rejectedSteps: ServiceStep[] = [
          {
            id: 'request-created',
            title: 'Request Placed',
            description: 'Your service request has been created',
            icon: <Icon name="package" size={20} color="#FFFFFF" />,
            status: 'completed',
            completedAt: createdAt,
            estimatedTime: '0 min',
          },
          {
            id: 'assigned',
            title: 'Technician Assigned',
            description: 'A technician has accepted your request',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status: 'completed',
            completedAt: acceptedAt || undefined,
            estimatedTime: '5-10 min',
          },
          {
            id: 'arrived-at-shop',
            title: 'Arrived at Location',
            description: 'Technician has arrived at your location',
            icon: <Icon name="map-pin" size={20} color="#FFFFFF" />,
            status: 'completed',
            estimatedTime: 'Variable',
          },
          {
            id: 'device-received',
            title: 'Device Received',
            description: 'Your device has been received',
            icon: <Icon name="check-square" size={20} color="#FFFFFF" />,
            status: 'completed',
            estimatedTime: '1-3 hours',
          },
          {
            id: 'verification',
            title: 'Problem Identified',
            description: 'Problem was diagnosed and pricing was provided',
            icon: <Icon name="eye" size={20} color="#FFFFFF" />,
            status: 'completed',
            estimatedTime: '30 min - 2 hours',
          },
          {
            id: 'service-completed',
            title: 'Service Completed',
            description: 'Pricing was declined. Service completed without repair.',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status: status === 'Completed' ? 'completed' : 'in-progress',
            completedAt: serviceRequest.completedAt
              ? new Date(serviceRequest.completedAt)
              : undefined,
          },
        ];
        setSteps(rejectedSteps);
      } else {
        // Normal onsite flow
        const onsiteSteps: ServiceStep[] = [
          {
            id: 'request-created',
            title: 'Request Placed',
            description: 'Your service request has been created',
            icon: <Icon name="package" size={20} color="#FFFFFF" />,
            status: 'completed',
            completedAt: createdAt,
            estimatedTime: '0 min',
          },
          {
            id: 'assigned',
            title: 'Technician Assigned',
            description: 'A technician has accepted your request',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status: status === 'Pending' ? 'pending' : 'completed',
            completedAt: acceptedAt || undefined,
            estimatedTime: '5-10 min',
          },
          {
            id: 'arrived-at-shop',
            title: 'Arrived at Location',
            description: 'Technician has arrived at your location',
            icon: <Icon name="map-pin" size={20} color="#FFFFFF" />,
            status:
              status === 'Arrived at Location' || status === 'Technician Arrived'
                ? 'in-progress'
                : [
                      'Device Received',
                      'Problem Verification',
                      'Onsite Problem Verification',
                      'Onsite Problem Identification',
                      'Problem Identification',
                      'Identification Done',
                      'Admin Review Pending',
                      'Customer Approval Pending',
                      'Repair',
                      'Repair Started',
                      'Repair Done',
                      'Device Delivered',
                      'Completed',
                    ].includes(status)
                  ? 'completed'
                  : 'pending',
            estimatedTime: 'Variable',
          },
          {
            id: 'device-received',
            title: 'Device Received',
            description: 'Your device has been received',
            icon: <Icon name="check-square" size={20} color="#FFFFFF" />,
            status:
              status === 'Device Received'
                ? 'in-progress'
                : [
                      'Problem Verification',
                      'Onsite Problem Verification',
                      'Onsite Problem Identification',
                      'Problem Identification',
                      'Identification Done',
                      'Admin Review Pending',
                      'Customer Approval Pending',
                      'Repair',
                      'Repair Started',
                      'Repair Done',
                      'Device Delivered',
                      'Completed',
                    ].includes(status)
                  ? 'completed'
                  : 'pending',
            estimatedTime: '1-3 hours',
          },
          {
            id: 'verification',
            title: 'Problem Verification',
            description: 'Technician is diagnosing the issue',
            icon: <Icon name="eye" size={20} color="#FFFFFF" />,
            status: [
              'Problem Verification',
              'Onsite Problem Verification',
              'Onsite Problem Identification',
              'Problem Identification',
              'Identification Done',
              'Admin Review Pending',
              'Customer Approval Pending',
            ].includes(status)
              ? 'in-progress'
              : [
                    'Repair',
                    'Repair Started',
                    'Repair Done',
                    'Device Delivered',
                    'Completed',
                  ].includes(status)
                ? 'completed'
                : 'pending',
            estimatedTime: '30 min - 2 hours',
          },
          {
            id: 'repair',
            title: 'Repair In Progress',
            description: 'Your device is being repaired',
            icon: <Icon name="tool" size={20} color="#FFFFFF" />,
            status:
              status === 'Repair' || status === 'Repair Started'
                ? 'in-progress'
                : ['Repair Done', 'Device Delivered', 'Completed'].includes(status)
                  ? 'completed'
                  : 'pending',
            estimatedTime: '2-4 hours',
          },
          {
            id: 'repair-done',
            title: 'Repair Completed',
            description: 'Your device has been repaired',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status:
              status === 'Repair Done'
                ? 'in-progress'
                : ['Device Delivered', 'Completed'].includes(status)
                  ? 'completed'
                  : 'pending',
            estimatedTime: '30 min - 1 hour',
          },
          {
            id: 'device-delivered',
            title: 'Device Collected',
            description: 'You have collected your device',
            icon: <Icon name="check-circle" size={20} color="#FFFFFF" />,
            status: ['Device Delivered', 'Completed'].includes(status) ? 'completed' : 'pending',
            completedAt: serviceRequest.completedAt
              ? new Date(serviceRequest.completedAt)
              : undefined,
          },
        ];
        setSteps(onsiteSteps);
      }
    }
  }, [serviceRequest, serviceType]);

  const calculateTimeDiff = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins} min`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateElapsedTime = (startDate: Date) => {
    const diffMs = currentTime.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins} min`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const currentStepIndex = steps.findIndex((step: ServiceStep) => step.status === 'in-progress');
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const lastCompletedStep = steps.filter((s: ServiceStep) => s.status === 'completed').pop();
  const displayStep = currentStep || lastCompletedStep || steps[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in-progress':
        return colors.primary;
      default:
        return colors.mutedForeground;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 16,
      marginVertical: spacing.md,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      backgroundColor: colors.card,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    titleText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary + '15',
      borderRadius: 8,
    },
    expandButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.primary,
    },
    collapsedContent: {
      marginTop: spacing.md,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
    },
    stepDescription: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
      lineHeight: 18,
    },
    stepTime: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    content: {
      padding: spacing.lg,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginBottom: spacing.xl,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    stepsList: {
      gap: spacing.lg,
    },
    stepCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: 12,
      borderWidth: 2,
      marginBottom: 2,
    },
    stepCardCompleted: {
      backgroundColor: colors.success + '8',
      borderColor: colors.success + '20',
    },
    stepCardInProgress: {
      backgroundColor: colors.primary + '8',
      borderColor: colors.primary + '20',
    },
    stepCardPending: {
      backgroundColor: colors.muted + '20',
      borderColor: colors.border,
      opacity: 0.7,
    },
    stepIconContainer: {
      width: 35,
      height: 35,
      borderRadius: 17.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDetails: {
      flex: 1,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      backgroundColor: colors.primary + '8',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '20',
      marginTop: spacing.lg,
    },
    summaryText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    summaryTime: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <View style={styles.title}>
            <Icon name="clock" size={20} color={colors.primary} />
            <Text style={styles.titleText}>Real-Time Service Progress</Text>
          </View>
        </View>

        <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.mutedForeground}
            />
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Hide Details' : 'Show All Steps'}
            </Text>
        </TouchableOpacity>

        {/* Collapsed Content */}
        {!isExpanded && displayStep && (
          <View style={styles.collapsedContent}>
            {lastCompletedStep && (
              <View style={styles.stepRow}>
                <View style={[styles.stepIcon, { backgroundColor: colors.success }]}>
                  <Icon name="check-circle" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{lastCompletedStep.title}</Text>
                  <Text style={styles.stepDescription}>{lastCompletedStep.description}</Text>
                </View>
                {lastCompletedStep.completedAt && (
                  <Text style={styles.stepTime}>
                    {calculateElapsedTime(lastCompletedStep.completedAt)}
                  </Text>
                )}
                
              </View>
            )}

            <View style={styles.divider} />

            {currentStep && currentStep.status === 'in-progress' && (
              <View style={[styles.stepRow, { marginTop: spacing.md, paddingTop: spacing.md }]}>
                
                <View style={[styles.stepIcon, { backgroundColor: colors.primary }]}>
                  <Icon name="loader" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.primary }]}>
                    {currentStep.title}
                  </Text>
                  <Text style={[styles.stepDescription, { color: colors.primary }]}>
                    {currentStep.description}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>In Progress</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Steps List */}
          <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
            {steps.map((step: ServiceStep, index: number) => (
              <View
                key={step.id}
                style={[
                  // styles.stepRow,
                  styles.stepCard,
                  step.status === 'completed'
                    ? styles.stepCardCompleted
                    : step.status === 'in-progress'
                    ? styles.stepCardInProgress
                    : styles.stepCardPending,
                ]}
              >
                <View
                  style={[
                    styles.stepIconContainer,
                    {
                      backgroundColor:
                        step.status === 'completed'
                          ? colors.success
                          : step.status === 'in-progress'
                          ? colors.primary
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {step.icon}
                </View>

                <View style={styles.stepDetails}>
                  <View style={styles.stepHeader}>
                    <Text
                      style={[
                        styles.stepTitle,
                        { color: getStatusColor(step.status) },
                      ]}
                    >
                      {step.title}
                    </Text>

                    
                  </View>

                      {step.status === 'completed' && step.completedAt && (
                      <Text style={[styles.stepTime, { color: colors.success }]}>
                        {calculateElapsedTime(step.completedAt)}
                      </Text>
                    )}

                    {step.status === 'in-progress' && (
                      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.badgeText}>In Progress</Text>
                      </View>
                    )}

                    {step.status === 'pending' && step.estimatedTime && (
                      <Text style={styles.stepTime}>Est: {step.estimatedTime}</Text>
                    )}
                  <Text
                    style={[
                      styles.stepDescription,
                      { color: getStatusColor(step.status) },
                    ]}
                  >
                    {step.description}
                  </Text>

                  {step.actualTime && (
                    <Text style={[styles.stepTime, { marginTop: spacing.xs }]}>
                      Completed in {step.actualTime}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Time Summary */}
          {serviceRequest.createdAt && (
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryText}>Total Elapsed Time</Text>
                <Text style={[styles.stepDescription, { color: colors.primary }]}>
                  Since request creation
                </Text>
              </View>
              <Text style={styles.summaryTime}>
                {calculateElapsedTime(new Date(serviceRequest.createdAt))}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
