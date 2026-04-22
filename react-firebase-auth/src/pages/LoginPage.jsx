import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    authLoading,
    loginWithEmail,
    loginWithGoogle,
    resendVerificationEmail,
    getFriendlyErrorMessage,
  } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [authLoading, navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setError('');
    setInfoMessage('');
    setShowResendButton(false);
    setLoading(true);

    try {
      await loginWithEmail(formData);
      navigate('/dashboard');
    } catch (authError) {
      if (authError.code === 'auth/email-not-verified') {
        setError('Please verify your email before logging in.');
        setInfoMessage('Check your inbox for the verification link, then log in again.');
        setShowResendButton(true);
      } else {
        setError(getFriendlyErrorMessage(authError));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setInfoMessage('');
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (authError) {
      setError(getFriendlyErrorMessage(authError));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setInfoMessage('');
    setResendLoading(true);

    try {
      await resendVerificationEmail(formData);
      setInfoMessage('A new verification email has been sent. Please check your inbox.');
    } catch (authError) {
      setError(getFriendlyErrorMessage(authError));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Login with Google or use your email and password."
    >
      <button className="secondary-button" onClick={handleGoogleLogin} disabled={googleLoading}>
        {googleLoading ? 'Opening Google...' : 'Continue with Google'}
      </button>

      <div className="divider">
        <span>or</span>
      </div>

      <form className="form-grid" onSubmit={handleEmailLogin}>
        <label>
          Email
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>

        {error ? <p className="message error-message">{error}</p> : null}
        {infoMessage ? <p className="message info-message">{infoMessage}</p> : null}

        {showResendButton ? (
          <button
            type="button"
            className="secondary-button"
            onClick={handleResendVerification}
            disabled={resendLoading || !formData.email || !formData.password}
          >
            {resendLoading ? 'Sending verification email...' : 'Resend verification email'}
          </button>
        ) : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <p className="footer-text">
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </p>
    </AuthCard>
  );
}

export default LoginPage;
