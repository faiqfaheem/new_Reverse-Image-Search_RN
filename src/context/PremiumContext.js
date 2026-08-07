import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PremiumContext = createContext(null);

const ONBOARDING_FILE_PATH = FileSystem.documentDirectory + 'onboarding_complete.json';

export function PremiumProvider({ children }) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        // Check onboarding completion status via AsyncStorage (primary) and FileSystem (fallback)
        let isCompleted = false;
        try {
          const hasCompletedVal = await AsyncStorage.getItem('hasCompletedOnboarding');
          if (hasCompletedVal === 'true') {
            isCompleted = true;
          } else {
            const onboardingInfo = await FileSystem.getInfoAsync(ONBOARDING_FILE_PATH);
            isCompleted = onboardingInfo.exists;
          }
        } catch (e) {
          try {
            const onboardingInfo = await FileSystem.getInfoAsync(ONBOARDING_FILE_PATH);
            isCompleted = onboardingInfo.exists;
          } catch (_) {}
        }

        if (isCompleted) {
          setIsOnboardingComplete(true);
        } else {
          setIsOnboardingComplete(false);
        }
      } catch (error) {
        console.warn('Error loading onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const flagOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      await FileSystem.writeAsStringAsync(ONBOARDING_FILE_PATH, JSON.stringify({ completed: true }));
      setIsOnboardingComplete(true);
    } catch (error) {
      console.warn('Error flagging onboarding as complete:', error);
      setIsOnboardingComplete(true);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('hasCompletedOnboarding');
      await FileSystem.deleteAsync(ONBOARDING_FILE_PATH, { idempotent: true });
      setIsOnboardingComplete(false);
    } catch (error) {
      console.warn('Error resetting onboarding status:', error);
      setIsOnboardingComplete(false);
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremiumUser: true,
        isOnboardingComplete,
        isLoading,
        flagOnboardingComplete,
        resetOnboarding,
        setIsOnboardingComplete,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
