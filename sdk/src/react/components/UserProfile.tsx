import React, { useState, FormEvent } from 'react';
import { useAuth } from '../TSAUTHProvider';

export interface UserProfileProps {
  onUpdate?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  appearance?: {
    primaryColor?: string;
    backgroundColor?: string;
  };
}

export function UserProfile({
  onUpdate,
  onError,
  className = '',
  appearance = {},
}: UserProfileProps) {
  const { user, isLoaded, client } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const accessToken = client.getAccessToken();
      const response = await fetch(`${client.getDomain()}/api/v1/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
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

  if (!user) {
    return (
      <div className={`TSAUTH-container ${className}`} style={styles}>
        <div className="TSAUTH-error">Please sign in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className={`TSAUTH-container ${className}`} style={styles}>
      <div className="TSAUTH-card">
        <div className="TSAUTH-header">
          <h1 className="TSAUTH-title">Profile</h1>
          <p className="TSAUTH-subtitle">Manage your account information</p>
        </div>

        {!isEditing ? (
          <div className="TSAUTH-profile-view">
            <div className="TSAUTH-profile-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="TSAUTH-avatar" />
              ) : (
                <div className="TSAUTH-avatar-placeholder">
                  {user.firstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="TSAUTH-profile-info">
              <div className="TSAUTH-field-display">
                <label className="TSAUTH-label">Full Name</label>
                <div className="TSAUTH-value">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : 'Not provided'
                  }
                </div>
              </div>

              <div className="TSAUTH-field-display">
                <label className="TSAUTH-label">Email</label>
                <div className="TSAUTH-value">
                  {user.email}
                  {user.emailVerified && (
                    <span className="TSAUTH-badge TSAUTH-badge-success">Verified</span>
                  )}
                </div>
              </div>

              <div className="TSAUTH-field-display">
                <label className="TSAUTH-label">Username</label>
                <div className="TSAUTH-value">{user.username}</div>
              </div>

              <div className="TSAUTH-field-display">
                <label className="TSAUTH-label">Roles</label>
                <div className="TSAUTH-badges">
                  {user.roles.map((role) => (
                    <span key={role} className="TSAUTH-badge">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsEditing(true);
                setFormData({
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  email: user.email,
                  username: user.username,
                });
              }}
              className="TSAUTH-button TSAUTH-button-secondary"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="TSAUTH-form">
            <div className="TSAUTH-field-group">
              <div className="TSAUTH-field TSAUTH-field-half">
                <label className="TSAUTH-label">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="TSAUTH-input"
                  disabled={isLoading}
                />
              </div>
              <div className="TSAUTH-field TSAUTH-field-half">
                <label className="TSAUTH-label">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="TSAUTH-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="TSAUTH-field">
              <label className="TSAUTH-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="TSAUTH-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="TSAUTH-field">
              <label className="TSAUTH-label">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="TSAUTH-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="TSAUTH-button-group">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="TSAUTH-button TSAUTH-button-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="TSAUTH-button TSAUTH-button-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="TSAUTH-spinner TSAUTH-spinner-sm"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}