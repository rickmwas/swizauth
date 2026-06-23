import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TSAUTHClient } from '../client/TSAUTHClient';
import { TSAUTHConfig, TSAUTHClientOptions, AuthState } from '../types';

interface TSAUTHContextValue extends AuthState {
  client: TSAUTHClient;
  signIn: TSAUTHClient['signIn'];
  signUp: TSAUTHClient['signUp'];
  signOut: TSAUTHClient['signOut'];
  getAccessToken: TSAUTHClient['getAccessToken'];
}

const TSAUTHContext = createContext<TSAUTHContextValue | null>(null);

interface TSAUTHProviderProps {
  children: ReactNode;
  config: TSAUTHConfig;
  options?: TSAUTHClientOptions;
}

export function TSAUTHProvider({ 
  children, 
  config, 
  options = {} 
}: TSAUTHProviderProps) {
  const [client] = useState(() => new TSAUTHClient(config, options));
  const [authState, setAuthState] = useState<AuthState>({
    isLoaded: false,
    isSignedIn: false,
    user: null,
    organization: null,
    session: null,
  });

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = client.subscribe(setAuthState);
    return unsubscribe;
  }, [client]);

  const contextValue: TSAUTHContextValue = {
    ...authState,
    client,
    signIn: client.signIn.bind(client),
    signUp: client.signUp.bind(client),
    signOut: client.signOut.bind(client),
    getAccessToken: client.getAccessToken.bind(client),
  };

  return (
    <TSAUTHContext.Provider value={contextValue}>
      {children}
    </TSAUTHContext.Provider>
  );
}

export function useAuth(): TSAUTHContextValue {
  const context = useContext(TSAUTHContext);
  if (!context) {
    throw new Error('useAuth must be used within a TSAUTHProvider');
  }
  return context;
}

export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuth();
  return { user, isLoaded, isSignedIn };
}

export function useOrganization() {
  const { organization, isLoaded } = useAuth();
  return { organization, isLoaded };
}

export function useSession() {
  const { session, isLoaded } = useAuth();
  return { session, isLoaded };
}