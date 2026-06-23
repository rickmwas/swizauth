import React, { useState, FormEvent } from 'react';
import { useAuth } from '../TSAUTHProvider';

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
    '--tsauth-primary': appearance.primaryColor || '#6366f1',
    '--tsauth-background': appearance.backgroundColor || '#ffffff',
  } as React.CSSProperties;

  if (!isLoaded) {
    return (
      <div className={`TSAUTH-container ${className}`} style={styles}>
        <div className="TSAUTH-loading">
          <div className="TSAUTH-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`TSAUTH-container ${className}`} style={styles}>
      <div className="TSAUTH-card">
        {appearance.logoUrl && (
          <div className="TSAUTH-logo">
            <img src={appearance.logoUrl} alt="Logo" />
          </div>
        )}
        
        <div className="TSAUTH-header">
          <h1 className="TSAUTH-title">Create your account</h1>
          <p className="TSAUTH-subtitle">Get started with your free account today.</p>
        </div>

        <form onSubmit={handleSubmit} className="TSAUTH-form">
          <div className="TSAUTH-field-group">
            <div className="TSAUTH-field TSAUTH-field-half">
              <label className="TSAUTH-label">First name</label>
              <input
                type="text"
                value={credentials.firstName}
                onChange={(e) => setCredentials({ ...credentials, firstName: e.target.value })}
                placeholder="First name"
                className="TSAUTH-input"
                disabled={isLoading}
              />
            </div>
            <div className="TSAUTH-field TSAUTH-field-half">
              <label className="TSAUTH-label">Last name</label>
              <input
                type="text"
                value={credentials.lastName}
                onChange={(e) => setCredentials({ ...credentials, lastName: e.target.value })}
                placeholder="Last name"
                className="TSAUTH-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="TSAUTH-field">
            <label className="TSAUTH-label">Email *</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              placeholder="Enter your email"
              className="TSAUTH-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="TSAUTH-field">
            <label className="TSAUTH-label">Username *</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="Choose a username"
              className="TSAUTH-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="TSAUTH-field">
            <label className="TSAUTH-label">Password *</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Create a password"
              className="TSAUTH-input"
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className="TSAUTH-field">
            <label className="TSAUTH-label">Confirm password *</label>
            <input
              type="password"
              value={credentials.confirmPassword}
              onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
              className="TSAUTH-input"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="TSAUTH-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="TSAUTH-button TSAUTH-button-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="TSAUTH-spinner TSAUTH-spinner-sm"></div>
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