import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

const PremiumContext = createContext(null);

const ONBOARDING_FILE_PATH = FileSystem.documentDirectory + 'onboarding_complete.json';
const PREMIUM_FILE_PATH = FileSystem.documentDirectory + 'premium_status.json';

export function PremiumProvider({ children }) {
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        // Check premium status
        let premiumFileExists = false;
        try {
          const premiumInfo = await FileSystem.getInfoAsync(PREMIUM_FILE_PATH);
          premiumFileExists = premiumInfo.exists;
        } catch (e) {}

        if (premiumFileExists) {
          setIsPremiumUser(true);
        }

        // Check onboarding completion status
        let onboardingFileExists = false;
        try {
          const onboardingInfo = await FileSystem.getInfoAsync(ONBOARDING_FILE_PATH);
          onboardingFileExists = onboardingInfo.exists;
        } catch (e) {}

        if (onboardingFileExists) {
          setIsOnboardingComplete(true);
        }
      } catch (error) {
        console.warn('Error loading premium or onboarding status via FileSystem:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const flagOnboardingComplete = async () => {
    try {
      await FileSystem.writeAsStringAsync(ONBOARDING_FILE_PATH, JSON.stringify({ completed: true }));
      setIsOnboardingComplete(true);
    } catch (error) {
      console.warn('Error flagging onboarding as complete:', error);
      setIsOnboardingComplete(true);
    }
  };

  const unlockPremium = async () => {
    try {
      await FileSystem.writeAsStringAsync(PREMIUM_FILE_PATH, JSON.stringify({ premium: true }));
      setIsPremiumUser(true);
      await flagOnboardingComplete();
    } catch (error) {
      console.warn('Error unlocking premium:', error);
      setIsPremiumUser(true);
      setIsOnboardingComplete(true);
    }
  };

  const bypassPremium = async () => {
    await flagOnboardingComplete();
  };

  const resetOnboarding = async () => {
    try {
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
        isPremiumUser,
        isOnboardingComplete,
        isLoading,
        unlockPremium,
        bypassPremium,
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
