import React, { useState, FormEvent } from 'react';
import { useAuth } from '../SwizAuthProvider';

export interface SignInProps {
  redirectUrl?: string;
  organizationId?: string;
  onSignIn?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  appearance?: {
    primaryColor?: string;
    backgroundColor?: string;
    logoUrl?: string;
  };
}

export function SignIn({
  redirectUrl,
  organizationId,
  onSignIn,
  onError,
  className = '',
  appearance = {},
}: SignInProps) {
  const { signIn, isLoaded } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn({
        [loginMethod]: credentials.email, // This handles both email and username
        password: credentials.password,
        organizationId,
      });
      
      onSignIn?.();
      
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    '--swizauth-primary': appearance.primaryColor || '#6366f1',
    '--swizauth-background': appearance.backgroundColor || '#ffffff',
  } as React.CSSProperties;

  if (!isLoaded) {
    return (
      <div className={`swizauth-container ${className}`} style={styles}>
        <div className="swizauth-loading">
          <div className="swizauth-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`swizauth-container ${className}`} style={styles}>
      <div className="swizauth-card">
        {appearance.logoUrl && (
          <div className="swizauth-logo">
            <img src={appearance.logoUrl} alt="Logo" />
          </div>
        )}
        
        <div className="swizauth-header">
          <h1 className="swizauth-title">Sign in to your account</h1>
          <p className="swizauth-subtitle">Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={handleSubmit} className="swizauth-form">
          <div className="swizauth-field">
            <label className="swizauth-label">
              {loginMethod === 'email' ? 'Email' : 'Username'}
            </label>
            <input
              type={loginMethod === 'email' ? 'email' : 'text'}
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your username'}
              className="swizauth-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="swizauth-field">
            <label className="swizauth-label">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Enter your password"
              className="swizauth-input"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="swizauth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="swizauth-button swizauth-button-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="swizauth-spinner swizauth-spinner-sm"></div>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>

          <div className="swizauth-toggle">
            <button
              type="button"
              onClick={() => setLoginMethod(loginMethod === 'email' ? 'username' : 'email')}
              className="swizauth-link"
              disabled={isLoading}
            >
              Sign in with {loginMethod === 'email' ? 'username' : 'email'} instead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}