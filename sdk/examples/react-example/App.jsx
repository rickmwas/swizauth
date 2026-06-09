import React from 'react';
import {
  SwizAuthProvider,
  SignIn,
  SignUp,
  UserProfile,
  OrganizationSwitcher,
  useAuth,
  useUser,
  useOrganization
} from '@swizauth/js';

// Main App wrapper with SwizAuth provider
function App() {
  const swizAuthConfig = {
    clientId: process.env.REACT_APP_SWIZAUTH_CLIENT_ID || 'your_client_id',
    domain: process.env.REACT_APP_SWIZAUTH_DOMAIN || 'http://localhost:8080',
    organizationId: process.env.REACT_APP_SWIZAUTH_ORG_ID, // Optional
  };

  const swizAuthOptions = {
    storage: 'localStorage', // or 'sessionStorage' or 'memory'
    onTokenExpired: () => {
      console.log('Token expired, please sign in again');
    },
    onSessionExpired: () => {
      console.log('Session expired');
    }
  };

  return (
    <SwizAuthProvider config={swizAuthConfig} options={swizAuthOptions}>
      <div className="app">
        <AuthenticatedApp />
      </div>
    </SwizAuthProvider>
  );
}

// Main application component that handles auth state
function AuthenticatedApp() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading spinner while auth state is being determined
  if (!isLoaded) {
    return (
      <div className="loading-container">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show authentication options
  if (!isSignedIn) {
    return <AuthenticationFlow />;
  }

  // If authenticated, show the main application
  return <MainApp />;
}

// Authentication flow for non-authenticated users
function AuthenticationFlow() {
  const [mode, setMode] = React.useState('signin'); // 'signin' or 'signup'

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Welcome to SwizAuth Demo</h1>
        <div className="auth-tabs">
          <button 
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button 
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>
      </div>

      {mode === 'signin' ? (
        <SignIn
          onSignIn={() => {
            console.log('User signed in successfully!');
          }}
          onError={(error) => {
            console.error('Sign in error:', error);
          }}
          appearance={{
            primaryColor: '#6366f1',
            backgroundColor: '#ffffff',
            logoUrl: '/logo.png' // Optional: your app logo
          }}
        />
      ) : (
        <SignUp
          onSignUp={() => {
            console.log('User signed up successfully!');
          }}
          onError={(error) => {
            console.error('Sign up error:', error);
          }}
          appearance={{
            primaryColor: '#6366f1',
            backgroundColor: '#ffffff',
            logoUrl: '/logo.png' // Optional: your app logo
          }}
        />
      )}
    </div>
  );
}

// Main application for authenticated users
function MainApp() {
  const [currentView, setCurrentView] = React.useState('dashboard');

  return (
    <div className="main-app">
      <Header />
      <div className="app-layout">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <MainContent currentView={currentView} />
      </div>
    </div>
  );
}

// Header component with user info and organization switcher
function Header() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();

  return (
    <header className="app-header">
      <div className="header-left">
        <h2>SwizAuth Demo App</h2>
      </div>
      
      <div className="header-center">
        {organization && (
          <OrganizationSwitcher
            onSwitch={(newOrg) => {
              console.log('Switched to organization:', newOrg);
            }}
            appearance={{
              primaryColor: '#6366f1'
            }}
          />
        )}
      </div>

      <div className="header-right">
        <div className="user-info">
          <span>Welcome, {user?.firstName || user?.email}</span>
        </div>
        <button 
          onClick={() => signOut()}
          className="sign-out-btn"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

// Sidebar navigation
function Sidebar({ currentView, onViewChange }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <nav>
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

// Main content area
function MainContent({ currentView }) {
  switch (currentView) {
    case 'dashboard':
      return <Dashboard />;
    case 'profile':
      return <ProfileView />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
}

// Dashboard component
function Dashboard() {
  const { user } = useUser();
  const { organization } = useOrganization();

  return (
    <div className="dashboard">
      <h3>Dashboard</h3>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h4>User Information</h4>
          <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Roles:</strong> {user?.roles?.join(', ') || 'None'}</p>
        </div>
        
        <div className="dashboard-card">
          <h4>Organization</h4>
          <p><strong>Name:</strong> {organization?.name}</p>
          <p><strong>Plan:</strong> {organization?.plan}</p>
          <p><strong>Status:</strong> {organization?.status}</p>
        </div>

        <div className="dashboard-card">
          <h4>Permissions</h4>
          <div className="permissions-list">
            {user?.permissions?.length > 0 ? (
              user.permissions.map(permission => (
                <span key={permission} className="permission-tag">
                  {permission}
                </span>
              ))
            ) : (
              <p>No permissions assigned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile view with UserProfile component
function ProfileView() {
  return (
    <div className="profile-view">
      <h3>Profile Management</h3>
      <UserProfile
        onUpdate={() => {
          console.log('Profile updated successfully!');
        }}
        onError={(error) => {
          console.error('Profile update error:', error);
        }}
        appearance={{
          primaryColor: '#6366f1'
        }}
      />
    </div>
  );
}

// Settings component
function Settings() {
  const { client } = useAuth();

  const handleGetAccessToken = () => {
    const token = client.getAccessToken();
    console.log('Access Token:', token);
  };

  return (
    <div className="settings">
      <h3>Application Settings</h3>
      <div className="settings-section">
        <h4>Developer Tools</h4>
        <button onClick={handleGetAccessToken}>
          Log Access Token to Console
        </button>
      </div>
      
      <div className="settings-section">
        <h4>API Integration</h4>
        <p>Use the access token to make authenticated API calls to your backend services.</p>
        <pre><code>{`
// Example API call with SwizAuth token
const makeAuthenticatedRequest = async () => {
  const token = client.getAccessToken();
  
  const response = await fetch('/api/protected-endpoint', {
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};
        `}</code></pre>
      </div>
    </div>
  );
}

export default App;