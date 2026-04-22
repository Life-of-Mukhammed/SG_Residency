import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const fallbackName = useMemo(() => {
    if (user?.displayName) {
      return user.displayName;
    }

    if (user?.email) {
      return user.email.split('@')[0];
    }

    return 'User';
  }, [user]);

  const avatarInitial = useMemo(() => fallbackName.charAt(0).toUpperCase(), [fallbackName]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-shell">
      <div className="card dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Protected Dashboard</p>
            <h1>Hello, {fallbackName}</h1>
            <p className="helper-text">You are logged in and your session will stay active after refresh.</p>
          </div>
          <button className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="profile-panel">
          {user?.photoURL ? (
            <img className="avatar" src={user.photoURL} alt={fallbackName} />
          ) : (
            <div className="avatar avatar-fallback" aria-label={fallbackName}>
              {avatarInitial}
            </div>
          )}

          <div className="profile-details">
            <div>
              <span className="detail-label">Name</span>
              <strong>{fallbackName}</strong>
            </div>
            <div>
              <span className="detail-label">Email</span>
              <strong>{user?.email || 'No email available'}</strong>
            </div>
            <div>
              <span className="detail-label">Email verified</span>
              <strong>{user?.emailVerified ? 'Yes' : 'No'}</strong>
            </div>
            <div>
              <span className="detail-label">User ID</span>
              <strong className="mono-text">{user?.uid}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
