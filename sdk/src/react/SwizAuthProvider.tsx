import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SwizAuthClient } from '../client/SwizAuthClient';
import { SwizAuthConfig, SwizAuthClientOptions, AuthState } from '../types';

interface SwizAuthContextValue extends AuthState {
  client: SwizAuthClient;
  signIn: SwizAuthClient['signIn'];
  signUp: SwizAuthClient['signUp'];
  signOut: SwizAuthClient['signOut'];
  getAccessToken: SwizAuthClient['getAccessToken'];
}

const SwizAuthContext = createContext<SwizAuthContextValue | null>(null);

interface SwizAuthProviderProps {
  children: ReactNode;
  config: SwizAuthConfig;
  options?: SwizAuthClientOptions;
}

export function SwizAuthProvider({ 
  children, 
  config, 
  options = {} 
}: SwizAuthProviderProps) {
  const [client] = useState(() => new SwizAuthClient(config, options));
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

  const contextValue: SwizAuthContextValue = {
    ...authState,
    client,
    signIn: client.signIn.bind(client),
    signUp: client.signUp.bind(client),
    signOut: client.signOut.bind(client),
    getAccessToken: client.getAccessToken.bind(client),
  };

  return (
    <SwizAuthContext.Provider value={contextValue}>
      {children}
    </SwizAuthContext.Provider>
  );
}

export function useAuth(): SwizAuthContextValue {
  const context = useContext(SwizAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a SwizAuthProvider');
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