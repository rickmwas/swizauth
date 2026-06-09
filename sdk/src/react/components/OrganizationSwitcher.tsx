import React, { useState, useEffect } from 'react';
import { useAuth } from '../SwizAuthProvider';
import { Organization } from '../../types';

export interface OrganizationSwitcherProps {
  onSwitch?: (organization: Organization) => void;
  className?: string;
  appearance?: {
    primaryColor?: string;
    backgroundColor?: string;
  };
}

export function OrganizationSwitcher({
  onSwitch,
  className = '',
  appearance = {},
}: OrganizationSwitcherProps) {
  const { organization, isLoaded, client } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && organization) {
      loadUserOrganizations();
    }
  }, [isLoaded, organization]);

  const loadUserOrganizations = async () => {
    try {
      const accessToken = client.getAccessToken();
      const response = await fetch(`${client.getDomain()}/api/v1/auth/organizations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const switchOrganization = async (targetOrg: Organization) => {
    if (targetOrg.id === organization?.id) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const accessToken = client.getAccessToken();
      const response = await fetch(`${client.getDomain()}/api/v1/auth/switch-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ organization_id: targetOrg.id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update tokens and reload user context
        client['storeTokens'](data.tokens);
        await client['loadUserFromToken'](data.tokens.access_token);
        onSwitch?.(targetOrg);
      } else {
        throw new Error('Failed to switch organization');
      }
    } catch (error) {
      console.error('Organization switch failed:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const styles = {
    '--swizauth-primary': appearance.primaryColor || '#6366f1',
    '--swizauth-background': appearance.backgroundColor || '#ffffff',
  } as React.CSSProperties;

  if (!isLoaded || !organization) {
    return null;
  }

  return (
    <div className={`swizauth-org-switcher ${className}`} style={styles}>
      <button
        className="swizauth-org-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <div className="swizauth-org-info">
          {organization.logoUrl ? (
            <img 
              src={organization.logoUrl} 
              alt={organization.name}
              className="swizauth-org-logo"
            />
          ) : (
            <div className="swizauth-org-avatar">
              {organization.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="swizauth-org-details">
            <div className="swizauth-org-name">{organization.name}</div>
            <div className="swizauth-org-plan">{organization.plan}</div>
          </div>
        </div>
        <div className={`swizauth-chevron ${isOpen ? 'swizauth-chevron-up' : 'swizauth-chevron-down'}`}>
          ▼
        </div>
      </button>

      {isOpen && (
        <div className="swizauth-org-dropdown">
          <div className="swizauth-org-list">
            {organizations.map((org) => (
              <button
                key={org.id}
                className={`swizauth-org-option ${
                  org.id === organization.id ? 'swizauth-org-option-active' : ''
                }`}
                onClick={() => switchOrganization(org)}
                disabled={isLoading}
              >
                <div className="swizauth-org-info">
                  {org.logoUrl ? (
                    <img 
                      src={org.logoUrl} 
                      alt={org.name}
                      className="swizauth-org-logo"
                    />
                  ) : (
                    <div className="swizauth-org-avatar">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="swizauth-org-details">
                    <div className="swizauth-org-name">{org.name}</div>
                    <div className="swizauth-org-plan">{org.plan}</div>
                  </div>
                </div>
                {org.id === organization.id && (
                  <div className="swizauth-check">✓</div>
                )}
              </button>
            ))}
          </div>
          
          {organizations.length === 0 && (
            <div className="swizauth-org-empty">
              No other organizations available
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="swizauth-org-loading">
          <div className="swizauth-spinner swizauth-spinner-sm"></div>
        </div>
      )}
    </div>
  );
}