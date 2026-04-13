import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../lib/contexts/auth-context';

import type { User } from '../../core/api';

import {
  hasCompletedOnboarding,
  setOnboardingCompleted,
  getStoredUser,
  setAuth,
  clearAuth,
} from '../../core/storage';

import { LoginScreen } from './LoginScreen';
import { SignupScreen } from './SignupScreen';
import { AccountScreen } from './AccountScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { GoogleOAuthScreen } from './GoogleOAuthScreen';


const Stack = createNativeStackNavigator();

export default function AuthStack({ route }: { route: { params?: { screen?: string } } }) {
    const initialScreen = route.params?.screen || 'Login';

    const { user, setUser, logout } = useAuth();

      const handleLoginSuccess = async (token: string, user: User) => {
        await setAuth(token, user);
        setUser(user);
      };
    
      const handleLogout = () => {
        logout().catch(() => {});
        clearAuth();
        setUser(null);
      };
    
    
    return (
        <Stack.Navigator initialRouteName={initialScreen}>
            <Stack.Screen name="Login">
                {(props) => (
                    <LoginScreen
                        onBack={() => props.navigation.goBack()}
                        onSuccess={async (token, user) => {
                            // Handle successful login
                            console.log('Login successful', { token, user });
                            await handleLoginSuccess(token, user);
                            props.navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main' }],
                            });
                        }}
                        onForgotPassword={() => props.navigation.navigate('ResetPassword')}
                        onGooglePress={() => props.navigation.navigate('GoogleOAuth')}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="Signup">
                {(props) => (
                    <SignupScreen
                        onBack={() => props.navigation.goBack()}
                        onSuccess={async (token, user) => {
                            // Handle successful signup
                            console.log('Signup successful', { token, user });
                            await handleLoginSuccess(token, user);
                            props.navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main' }],
                            });
                        }}
                        onGooglePress={() => props.navigation.navigate('GoogleOAuth')}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="Account">
                {(props) => (
                    <AccountScreen
                        onLogout={async () => {
                            console.log('Logout');
                            await clearAuth();
                            props.navigation.navigate('Login');
                        }}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="ResetPassword">
                {(props) => (
                    <ResetPasswordScreen
                        onBack={() => props.navigation.goBack()}
                        onSuccess={() => {
                            // Handle password reset success
                            console.log('Password reset successful');
                            props.navigation.navigate('Login');
                            
                        }}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="GoogleOAuth">
                {(props) => (
                    <GoogleOAuthScreen
                        onBack={() => props.navigation.goBack()}
                        onSuccess={async (token, user) => {
                            // Handle Google OAuth success
                            console.log('Google OAuth successful', { token, user });
                            await handleLoginSuccess(token, user);
                            props.navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main' }],
                            });
                        }}
                    />
                )}
            </Stack.Screen>
        </Stack.Navigator>
    )
}