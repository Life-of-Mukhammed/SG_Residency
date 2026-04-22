import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { user, authLoading, registerWithEmail, getFriendlyErrorMessage } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [authLoading, navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail(formData);
      setSuccessMessage(
        'Account created successfully. We sent a verification link to your email. Please verify before logging in.'
      );
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (authError) {
      setError(getFriendlyErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create an account"
      subtitle="Register with email and verify your inbox before logging in."
    >
      <form className="form-grid" onSubmit={handleRegister}>
        <label>
          Full name
          <input
            name="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

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
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Confirm password
          <input
            name="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>

        {error ? <p className="message error-message">{error}</p> : null}
        {successMessage ? <p className="message success-message">{successMessage}</p> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="footer-text">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthCard>
  );
}

export default RegisterPage;
