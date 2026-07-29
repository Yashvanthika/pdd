import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/mobile/AuthContext';
import {
  ChangePasswordScreen,
  EditProfileScreen,
  ForgotPasswordScreen,
  LastDonationScreen,
  LoginScreen,
  MyPageScreen,
  RegisterProfileScreen,
  ResultsScreen,
  SearchScreen,
} from './src/mobile/screens';
import type { AppStackParamList, AuthStackParamList } from './src/mobile/navigation';
import { colors } from './src/mobile/theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const DonorStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="RegisterProfile" component={RegisterProfileScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function DonorNavigator() {
  return (
    <DonorStack.Navigator screenOptions={{ headerShown: false }}>
      <DonorStack.Screen name="Search" component={SearchScreen} />
      <DonorStack.Screen name="Results" component={ResultsScreen} />
      <DonorStack.Screen name="MyPage" component={MyPageScreen} />
      <DonorStack.Screen name="EditProfile" component={EditProfileScreen} />
      <DonorStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <DonorStack.Screen name="LastDonation" component={LastDonationScreen} />
    </DonorStack.Navigator>
  );
}

function RootNavigator() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <DonorNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
