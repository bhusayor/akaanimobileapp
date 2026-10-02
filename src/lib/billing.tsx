import Constants from 'expo-constants';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import type { BillingCycle } from './subscription';

const ENTITLEMENT_ID = 'premium';
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
let configured = false;

type BillingState = {
  available: boolean;
  loading: boolean;
  error: string | null;
  offering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  getPackage: (cycle: BillingCycle) => PurchasesPackage | null;
  purchase: (cycle: BillingCycle) => Promise<'active' | 'cancelled' | 'pending'>;
  restore: () => Promise<boolean>;
};

const BillingContext = createContext<BillingState | null>(null);

export function hasPremium(info: CustomerInfo | null): boolean {
  return info?.entitlements.active[ENTITLEMENT_ID]?.isActive === true;
}

function purchaseKey(): string | undefined {
  return Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : undefined;
}

export function BillingProvider({ children }: { children: React.ReactNode }) {
  // Expo Go previews purchases in JavaScript; it cannot open a real store sheet.
  const available = !!purchaseKey() && Platform.OS !== 'web' && Constants.appOwnership !== 'expo';
  const [loading, setLoading] = useState(available);
  const [error, setError] = useState<string | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    if (!available) return;
    let mounted = true;
    let listening = false;
    const listener = (info: CustomerInfo) => { if (mounted) setCustomerInfo(info); };
    try {
      if (!configured) {
        Purchases.configure({ apiKey: purchaseKey()! });
        configured = true;
      }
      Purchases.addCustomerInfoUpdateListener(listener);
      listening = true;
      Promise.allSettled([Purchases.getCustomerInfo(), Purchases.getOfferings()])
        .then(([customer, offers]) => {
          if (!mounted) return;
          if (customer.status === 'fulfilled') setCustomerInfo(customer.value);
          if (offers.status === 'fulfilled') setOffering(offers.value.current);
          if (offers.status === 'rejected') setError('Could not load plans. Check your connection and try again.');
          else if (!offers.value.current) setError('Plans are not available yet. Please try again later.');
        })
        .finally(() => { if (mounted) setLoading(false); });
    } catch {
      setError('Purchases are not ready on this build.');
      setLoading(false);
    }
    return () => {
      mounted = false;
      if (listening) Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [available]);

  const getPackage = useCallback((cycle: BillingCycle) => {
    if (!offering) return null;
    return cycle === 'yearly' ? offering.annual : offering.monthly;
  }, [offering]);

  const purchase = useCallback(async (cycle: BillingCycle): Promise<'active' | 'cancelled' | 'pending'> => {
    const selected = getPackage(cycle);
    if (!available || !selected) throw new Error('This plan is not ready in the app store yet.');
    try {
      const result = await Purchases.purchasePackage(selected);
      setCustomerInfo(result.customerInfo);
      return hasPremium(result.customerInfo) ? 'active' : 'pending';
    } catch (cause) {
      if (cause && typeof cause === 'object' && 'userCancelled' in cause && cause.userCancelled === true) return 'cancelled';
      throw cause;
    }
  }, [available, getPackage]);

  const restore = useCallback(async () => {
    if (!available) throw new Error('Restore is available in the iOS or Android app.');
    const info = await Purchases.restorePurchases();
    setCustomerInfo(info);
    return hasPremium(info);
  }, [available]);

  const value = useMemo<BillingState>(() => ({
    available, loading, error, offering, customerInfo, getPackage, purchase, restore,
  }), [available, loading, error, offering, customerInfo, getPackage, purchase, restore]);
  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingState {
  const value = useContext(BillingContext);
  if (!value) throw new Error('useBilling must be used within BillingProvider');
  return value;
}
