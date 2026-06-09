import React, { useState, FormEvent } from 'react';
import { useAuth } from '../SwizAuthProvider';

export interface SignUpProps {
  redirectUrl?: string;
  organizationId?: string;
  onSignUp?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  appearance?: {
    primaryColor?: string;
    backgroundColor?: string;
    logoUrl?: string;
  };
}

export function SignUp({
  redirectUrl,
  organizationId,
  onSignUp,
  onError,
  className = '',
  appearance = {},
}: SignUpProps) {
  const { signUp, isLoaded } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (credentials.password !== credentials.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await signUp({
        email: credentials.email,
        username: credentials.username,
        password: credentials.password,
        firstName: credentials.firstName || undefined,
        lastName: credentials.lastName || undefined,
        organizationId,
      });
      
      onSignUp?.();
      
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
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
          <h1 className="swizauth-title">Create your account</h1>
          <p className="swizauth-subtitle">Get started with your free account today.</p>
        </div>

        <form onSubmit={handleSubmit} className="swizauth-form">
          <div className="swizauth-field-group">
            <div className="swizauth-field swizauth-field-half">
              <label className="swizauth-label">First name</label>
              <input
                type="text"
                value={credentials.firstName}
                onChange={(e) => setCredentials({ ...credentials, firstName: e.target.value })}
                placeholder="First name"
                className="swizauth-input"
                disabled={isLoading}
              />
            </div>
            <div className="swizauth-field swizauth-field-half">
              <label className="swizauth-label">Last name</label>
              <input
                type="text"
                value={credentials.lastName}
                onChange={(e) => setCredentials({ ...credentials, lastName: e.target.value })}
                placeholder="Last name"
                className="swizauth-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="swizauth-field">
            <label className="swizauth-label">Email *</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              placeholder="Enter your email"
              className="swizauth-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="swizauth-field">
            <label className="swizauth-label">Username *</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="Choose a username"
              className="swizauth-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="swizauth-field">
            <label className="swizauth-label">Password *</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Create a password"
              className="swizauth-input"
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className="swizauth-field">
            <label className="swizauth-label">Confirm password *</label>
            <input
              type="password"
              value={credentials.confirmPassword}
              onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}