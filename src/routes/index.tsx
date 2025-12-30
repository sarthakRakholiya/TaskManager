import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './authstack';
import AppStack from './appstack';
import { getApp } from '@react-native-firebase/app';
import auth, { onAuthStateChanged } from '@react-native-firebase/auth';

const RootNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  useEffect(() => {
    const app = getApp();
    const authInstance = auth(app);

    const subscriber = onAuthStateChanged(authInstance, userData => {
      if (initializing) setInitializing(false);
      setIsAuthenticated(!!userData);
    });

    return subscriber;
  }, [initializing, isAuthenticated]);

  if (initializing) return null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;

