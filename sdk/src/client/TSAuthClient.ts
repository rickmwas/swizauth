import { jwtDecode } from 'jwt-decode';
import {
  TSAUTHConfig,
  TSAUTHClientOptions,
  User,
  Organization,
  Session,
  AuthTokens,
  AuthResult,
  AuthError,
  LoginCredentials,
  RegisterCredentials,
  AuthState,
} from '../types';

export class TSAUTHClient {
  private config: TSAUTHConfig;
  private options: TSAUTHClientOptions;
  private storage: Storage;
  private authState: AuthState;
  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor(config: TSAUTHConfig, options: TSAUTHClientOptions = {}) {
    this.config = {
      ...config,
      scope: config.scope || 'openid profile email',
    };
    this.options = options;
    
    // Choose storage mechanism
    this.storage = this.getStorage(options.storage || 'localStorage');
    
    // Initialize auth state
    this.authState = {
      isLoaded: false,
      isSignedIn: false,
      user: null,
      organization: null,
      session: null,
    };

    // Initialize client
    this.init();
  }

  // Public getter for domain
  public getDomain(): string {
    return this.config.domain;
  }

  private getStorage(type: 'localStorage' | 'sessionStorage' | 'memory'): Storage {
    if (type === 'memory') {
      // In-memory storage fallback
      const memoryStorage: Storage = {
        length: 0,
        key: (index: number) => Object.keys(memoryStorage)[index] || null,
        getItem: (key: string) => (memoryStorage as any)[key] || null,
        setItem: (key: string, value: string) => {
          (memoryStorage as any)[key] = value;
          memoryStorage.length = Object.keys(memoryStorage).length;
        },
        removeItem: (key: string) => {
          delete (memoryStorage as any)[key];
          memoryStorage.length = Object.keys(memoryStorage).length;
        },
        clear: () => {
          Object.keys(memoryStorage).forEach(key => delete (memoryStorage as any)[key]);
          memoryStorage.length = 0;
        }
      };
      return memoryStorage;
    }
    
    try {
      return type === 'sessionStorage' ? sessionStorage : localStorage;
    } catch {
      // Fallback to memory storage if localStorage/sessionStorage is not available
      return this.getStorage('memory');
    }
  }

  private async init(): Promise<void> {
    try {
      await this.loadStoredAuth();
      this.notifyListeners();
    } catch (error) {
      console.error('TSAUTH initialization error:', error);
      this.authState.isLoaded = true;
      this.notifyListeners();
    }
  }

  private async loadStoredAuth(): Promise<void> {
    const accessToken = this.storage.getItem('TSAUTH_access_token');
    const refreshToken = this.storage.getItem('TSAUTH_refresh_token');

    if (!accessToken || !refreshToken) {
      this.authState.isLoaded = true;
      return;
    }

    try {
      // Check if access token is expired
      const decoded = jwtDecode(accessToken);
      const now = Date.now() / 1000;

      if (decoded.exp && decoded.exp > now) {
        // Token is still valid, load user data
        await this.loadUserFromToken(accessToken);
      } else if (refreshToken) {
        // Token expired, try to refresh
        await this.refreshTokens();
      } else {
        // No refresh token, clear auth
        this.clearAuth();
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      this.clearAuth();
    }

    this.authState.isLoaded = true;
  }

  private async loadUserFromToken(accessToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.domain}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.authState.isSignedIn = true;
        this.authState.user = data.user;
        this.authState.organization = data.organization;
        this.authState.session = data.session;
      } else {
        throw new Error('Failed to load user data');
      }
    } catch (error) {
      console.error('Error loading user from token:', error);
      throw error;
    }
  }

  // Public API Methods

  public async signIn(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.config.domain}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.config.clientId,
        },
        body: JSON.stringify({
          ...credentials,
          organization_id: credentials.organizationId || this.config.organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      await this.handleAuthSuccess(data);
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  public async signUp(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.config.domain}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.config.clientId,
        },
        body: JSON.stringify({
          ...credentials,
          organization_id: credentials.organizationId || this.config.organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      await this.handleAuthSuccess(data);
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    try {
      const refreshToken = this.storage.getItem('TSAUTH_refresh_token');
      
      if (refreshToken) {
        await fetch(`${this.config.domain}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': this.config.clientId,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.clearAuth();
      this.notifyListeners();
    }
  }

  public async refreshTokens(): Promise<void> {
    const refreshToken = this.storage.getItem('TSAUTH_refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.config.domain}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.config.clientId,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Token refresh failed');
      }

      this.storeTokens(data.tokens);
      await this.loadUserFromToken(data.tokens.access_token);
      
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      throw error;
    }
  }

  public getAccessToken(): string | null {
    return this.storage.getItem('TSAUTH_access_token');
  }

  public getUser(): User | null {
    return this.authState.user;
  }

  public getOrganization(): Organization | null {
    return this.authState.organization;
  }

  public getSession(): Session | null {
    return this.authState.session;
  }

  public isAuthenticated(): boolean {
    return this.authState.isSignedIn;
  }

  public isLoaded(): boolean {
    return this.authState.isLoaded;
  }

  // Event listeners
  public subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Private helper methods

  private async handleAuthSuccess(data: AuthResult): Promise<void> {
    this.storeTokens(data.tokens);
    this.authState.isSignedIn = true;
    this.authState.user = data.user;
    this.authState.organization = data.organization;
    this.authState.session = data.session;
    this.notifyListeners();
  }

  private storeTokens(tokens: AuthTokens): void {
    this.storage.setItem('TSAUTH_access_token', tokens.accessToken);
    this.storage.setItem('TSAUTH_refresh_token', tokens.refreshToken);
  }

  private clearAuth(): void {
    this.storage.removeItem('TSAUTH_access_token');
    this.storage.removeItem('TSAUTH_refresh_token');
    this.authState.isSignedIn = false;
    this.authState.user = null;
    this.authState.organization = null;
    this.authState.session = null;
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback({ ...this.authState }));
  }
}