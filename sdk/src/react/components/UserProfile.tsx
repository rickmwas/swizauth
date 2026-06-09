import React, { useState, FormEvent } from 'react';
import { useAuth } from '../SwizAuthProvider';

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

  if (!user) {
    return (
      <div className={`swizauth-container ${className}`} style={styles}>
        <div className="swizauth-error">Please sign in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className={`swizauth-container ${className}`} style={styles}>
      <div className="swizauth-card">
        <div className="swizauth-header">
          <h1 className="swizauth-title">Profile</h1>
          <p className="swizauth-subtitle">Manage your account information</p>
        </div>

        {!isEditing ? (
          <div className="swizauth-profile-view">
            <div className="swizauth-profile-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="swizauth-avatar" />
              ) : (
                <div className="swizauth-avatar-placeholder">
                  {user.firstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="swizauth-profile-info">
              <div className="swizauth-field-display">
                <label className="swizauth-label">Full Name</label>
                <div className="swizauth-value">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : 'Not provided'
                  }
                </div>
              </div>

              <div className="swizauth-field-display">
                <label className="swizauth-label">Email</label>
                <div className="swizauth-value">
                  {user.email}
                  {user.emailVerified && (
                    <span className="swizauth-badge swizauth-badge-success">Verified</span>
                  )}
                </div>
              </div>

              <div className="swizauth-field-display">
                <label className="swizauth-label">Username</label>
                <div className="swizauth-value">{user.username}</div>
              </div>

              <div className="swizauth-field-display">
                <label className="swizauth-label">Roles</label>
                <div className="swizauth-badges">
                  {user.roles.map((role) => (
                    <span key={role} className="swizauth-badge">
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
              className="swizauth-button swizauth-button-secondary"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="swizauth-form">
            <div className="swizauth-field-group">
              <div className="swizauth-field swizauth-field-half">
                <label className="swizauth-label">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="swizauth-input"
                  disabled={isLoading}
                />
              </div>
              <div className="swizauth-field swizauth-field-half">
                <label className="swizauth-label">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="swizauth-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="swizauth-field">
              <label className="swizauth-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="swizauth-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="swizauth-field">
              <label className="swizauth-label">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="swizauth-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="swizauth-button-group">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="swizauth-button swizauth-button-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="swizauth-button swizauth-button-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="swizauth-spinner swizauth-spinner-sm"></div>
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