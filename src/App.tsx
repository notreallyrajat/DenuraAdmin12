import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Coffee, Check } from 'lucide-react';
import { supabase } from './supabase';
import Dashboard from './Dashboard';
import './index.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [email, setEmail] = useState('cafe.owner8698@dinova.com');
  const [password, setPassword] = useState('SuperSecretCafePassword2026!');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0b', color: '#fff' }}>Loading...</div>;
  }

  if (session) {
    return <Dashboard session={session} />;
  }

  return (
    <div className="auth-container">
      {/* Left Abstract/Branding Pane */}
      <div className="auth-hero">
        <div className="hero-glow"></div>
        <div className="hero-decoration"></div>
        
        <div className="brand-logo">
          <div className="brand-logo-icon">
            <Coffee size={18} color="#fff" />
          </div>
          DinovaAdmin
        </div>

        <div className="hero-content">
          <h1>Manage your cafe beautifully.</h1>
          <p>
            Experience a modern, minimalist command center designed exclusively for culinary visionaries. Streamline operations, analyze trends, and grow your business with style.
          </p>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', zIndex: 10 }}>
          &copy; 2026 Dinova Systems. All rights reserved.
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-wrapper">
        <div className="form-container">
          
          {/* Mobile Logo */}
          <div className="mobile-logo">
            <div className="brand-logo-icon" style={{ width: 28, height: 28 }}>
              <Coffee size={16} color="#fff" />
            </div>
            DinovaAdmin
          </div>

          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Please enter your details to sign in to your dashboard.</p>
          </div>

          {errorMsg && (
            <div style={{ padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#86efac', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-field-wrapper">
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="admin@dinova.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-field-wrapper">
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="input-icon" />
              </div>
            </div>

            <div className="options-row">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  style={{ display: 'none' }} 
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <div className="custom-checkbox">
                  {rememberMe && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                Remember me
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Sign In'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <p className="signup-prompt" style={{ marginTop: 0 }}>
              In case of trouble, contact your Software Provider:
              <br />
              <a href="tel:+15550198273" className="signup-link" style={{ display: 'inline-block', marginTop: '0.5rem', marginLeft: 0 }}>
                +1 (555) 019-8273
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
