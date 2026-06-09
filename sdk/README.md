# SwizAuth JavaScript SDK

The official JavaScript SDK for SwizAuth - A modern, embeddable authentication solution for web applications.

## Features

🔐 **Complete Authentication Flow** - Sign up, sign in, password reset, email verification  
🎨 **Pre-built UI Components** - Beautiful, customizable auth widgets  
⚛️ **React Integration** - Hooks and components for React applications  
🌐 **Vanilla JS Support** - Works with any JavaScript framework or vanilla HTML  
🔄 **Session Management** - Automatic token refresh and session handling  
🏢 **Multi-tenant Ready** - Organization switching and management  
🎯 **TypeScript Support** - Full type definitions included  
📱 **Responsive Design** - Mobile-friendly components out of the box  

## Installation

```bash
# Using npm
npm install @swizauth/js

# Using yarn
yarn add @swizauth/js

# Using pnpm
pnpm add @swizauth/js
```

## Quick Start

### React Integration

```jsx
import React from 'react';
import { SwizAuthProvider, SignIn, useAuth } from '@swizauth/js';

// Wrap your app with the SwizAuth provider
function App() {
  return (
    <SwizAuthProvider 
      config={{
        clientId: 'your_client_id',
        domain: 'https://auth.yourdomain.com'
      }}
    >
      <AuthenticatedApp />
    </SwizAuthProvider>
  );
}

// Use the authentication state in your components
function AuthenticatedApp() {
  const { isSignedIn, user, signOut } = useAuth();

  if (!isSignedIn) {
    return <SignIn onSignIn={() => console.log('Welcome!')} />;
  }

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@swizauth/js@latest/dist/swizauth.css">
</head>
<body>
  <div id="auth-container"></div>
  
  <script src="https://cdn.jsdelivr.net/npm/@swizauth/js@latest/dist/swizauth.umd.js"></script>
  <script>
    // Initialize the client
    const client = new SwizAuth.SwizAuthClient({
      clientId: 'your_client_id',
      domain: 'https://auth.yourdomain.com'
    });

    // Render the sign-in component
    SwizAuth.renderSignIn('#auth-container', {
      onSignIn: () => console.log('Signed in!'),
      onError: (error) => console.error('Error:', error)
    });
  </script>
</body>
</html>
```

## Configuration

### Client Configuration

```javascript
const config = {
  clientId: 'your_client_id',        // Required: Your SwizAuth application client ID
  domain: 'https://auth.yourdomain.com', // Required: Your SwizAuth domain
  organizationId: 'org_id',          // Optional: Pre-select organization
  redirectUri: 'https://yourapp.com/callback', // Optional: OAuth redirect URI
  audience: 'api.yourdomain.com',    // Optional: API audience
  scope: 'openid profile email'     // Optional: OAuth scopes
};

const options = {
  storage: 'localStorage',           // 'localStorage' | 'sessionStorage' | 'memory'
  onTokenExpired: () => {           // Optional: Token expiration callback
    console.log('Please sign in again');
  },
  onSessionExpired: () => {         // Optional: Session expiration callback
    console.log('Session expired');
  },
  onRedirectCallback: (url) => {    // Optional: OAuth redirect callback
    window.history.pushState({}, '', url);
  }
};
```

## React Components

### SwizAuthProvider

The root provider component that manages authentication state.

```jsx
<SwizAuthProvider config={config} options={options}>
  {/* Your app components */}
</SwizAuthProvider>
```

### SignIn Component

Pre-built sign-in form with email/username and password fields.

```jsx
<SignIn
  redirectUrl="/dashboard"           // Optional: Redirect after sign in
  organizationId="org_123"          // Optional: Pre-select organization
  onSignIn={() => console.log('Success')}  // Optional: Success callback
  onError={(error) => console.error(error)} // Optional: Error callback
  className="custom-class"          // Optional: CSS class
  appearance={{                     // Optional: Styling
    primaryColor: '#6366f1',
    backgroundColor: '#ffffff',
    logoUrl: 'https://example.com/logo.png'
  }}
/>
```

### SignUp Component

Pre-built registration form with validation.

```jsx
<SignUp
  redirectUrl="/onboarding"         // Optional: Redirect after sign up
  organizationId="org_123"          // Optional: Pre-select organization
  onSignUp={() => console.log('Welcome')} // Optional: Success callback
  onError={(error) => console.error(error)} // Optional: Error callback
  appearance={{                     // Optional: Styling
    primaryColor: '#6366f1',
    backgroundColor: '#ffffff',
    logoUrl: 'https://example.com/logo.png'
  }}
/>
```

### UserProfile Component

User profile management with editable fields.

```jsx
<UserProfile
  onUpdate={() => console.log('Profile updated')} // Optional: Update callback
  onError={(error) => console.error(error)}       // Optional: Error callback
  appearance={{                     // Optional: Styling
    primaryColor: '#6366f1',
    backgroundColor: '#ffffff'
  }}
/>
```

### OrganizationSwitcher Component

Dropdown for switching between user's organizations.

```jsx
<OrganizationSwitcher
  onSwitch={(org) => console.log('Switched to:', org)} // Optional: Switch callback
  appearance={{                     // Optional: Styling
    primaryColor: '#6366f1',
    backgroundColor: '#ffffff'
  }}
/>
```

## React Hooks

### useAuth()

Main authentication hook providing auth state and methods.

```jsx
const {
  isLoaded,      // Boolean: Auth state loaded
  isSignedIn,    // Boolean: User is authenticated
  user,          // Object: Current user data
  organization,  // Object: Current organization
  session,       // Object: Current session
  client,        // Object: SwizAuth client instance
  signIn,        // Function: Sign in method
  signUp,        // Function: Sign up method
  signOut,       // Function: Sign out method
  getAccessToken // Function: Get current access token
} = useAuth();
```

### useUser()

Hook for user-specific data and state.

```jsx
const {
  user,      // Object: Current user data
  isLoaded,  // Boolean: User data loaded
  isSignedIn // Boolean: User is authenticated
} = useUser();
```

### useOrganization()

Hook for organization-specific data.

```jsx
const {
  organization, // Object: Current organization
  isLoaded      // Boolean: Organization data loaded
} = useOrganization();
```

### useSession()

Hook for session-specific data.

```jsx
const {
  session,  // Object: Current session
  isLoaded  // Boolean: Session data loaded
} = useSession();
```

## Vanilla JavaScript API

### Client Methods

```javascript
const client = new SwizAuth.SwizAuthClient(config, options);

// Authentication
await client.signIn({ email: 'user@example.com', password: 'password' });
await client.signUp({ email: 'user@example.com', username: 'user', password: 'password' });
await client.signOut();

// Token management
await client.refreshTokens();
const token = client.getAccessToken();

// User data
const user = client.getUser();
const organization = client.getOrganization();
const session = client.getSession();

// State checks
const isAuthenticated = client.isAuthenticated();
const isLoaded = client.isLoaded();

// Event listening
const unsubscribe = client.subscribe((authState) => {
  console.log('Auth state changed:', authState);
});
```

### Rendering Functions

```javascript
// Render sign-in component
SwizAuth.renderSignIn('#container', options);

// Render sign-up component  
SwizAuth.renderSignUp('#container', options);

// Render user profile
SwizAuth.renderUserProfile('#container', options);

// Render organization switcher
SwizAuth.renderOrganizationSwitcher('#container', options);
```

## Styling and Customization

### CSS Custom Properties

You can customize the appearance using CSS custom properties:

```css
:root {
  --swizauth-primary: #your-brand-color;
  --swizauth-background: #ffffff;
  --swizauth-foreground: #1f2937;
  --swizauth-muted: #6b7280;
  --swizauth-border: #e5e7eb;
  --swizauth-error: #ef4444;
  --swizauth-success: #10b981;
  --swizauth-radius: 8px;
}
```

### Component Appearance Props

```jsx
const appearance = {
  primaryColor: '#6366f1',      // Primary brand color
  backgroundColor: '#ffffff',   // Background color
  logoUrl: 'https://...',      // Company logo URL
};
```

### Custom CSS Classes

All components accept a `className` prop for custom styling:

```jsx
<SignIn className="my-custom-signin-form" />
```

## Error Handling

The SDK provides structured error handling:

```javascript
try {
  await client.signIn(credentials);
} catch (error) {
  console.log('Error code:', error.code);
  console.log('Error message:', error.message);
  
  // Common error codes:
  // INVALID_CREDENTIALS, EMAIL_EXISTS, VALIDATION_ERROR,
  // RATE_LIMIT_EXCEEDED, NETWORK_ERROR, etc.
}
```

## TypeScript Support

The SDK is built with TypeScript and includes comprehensive type definitions:

```typescript
import { 
  SwizAuthClient, 
  User, 
  Organization, 
  AuthTokens,
  LoginCredentials,
  RegisterCredentials 
} from '@swizauth/js';

const client = new SwizAuthClient({
  clientId: 'client_id',
  domain: 'https://auth.example.com'
});

// All methods and properties are fully typed
const user: User | null = client.getUser();
```

## Server-Side Integration

### Verifying Tokens

Use the access token to authenticate API requests:

```javascript
// Frontend: Include token in requests
const token = client.getAccessToken();
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Backend: Verify token with SwizAuth
const verifyResponse = await fetch('https://auth.yourdomain.com/api/v1/internal/verify-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${internal_api_secret}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ access_token: token })
});
```

## Examples

Check out the `/examples` directory for complete integration examples:

- **Vanilla JS**: `/examples/vanilla-js/index.html`
- **React**: `/examples/react-example/App.jsx`

## API Reference

### Configuration Types

```typescript
interface SwizAuthConfig {
  clientId: string;
  domain: string;
  redirectUri?: string;
  audience?: string;
  scope?: string;
  organizationId?: string;
}

interface SwizAuthClientOptions {
  onRedirectCallback?: (redirectUrl?: string) => void;
  onTokenExpired?: () => void;
  onSessionExpired?: () => void;
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
}
```

### User Data Types

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  organizationId: string;
  roles: string[];
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: string;
  status: string;
}
```

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- 📚 [Documentation](https://docs.swizauth.com)
- 💬 [Community Forum](https://community.swizauth.com)
- 🐛 [Issue Tracker](https://github.com/swizauth/js-sdk/issues)
- 📧 [Email Support](mailto:support@swizauth.com)