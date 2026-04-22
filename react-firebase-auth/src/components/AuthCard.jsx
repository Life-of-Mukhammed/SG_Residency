function AuthCard({ title, subtitle, children }) {
  return (
    <div className="page-shell">
      <div className="card auth-card">
        <div className="card-header">
          <p className="eyebrow">Firebase Auth Demo</p>
          <h1>{title}</h1>
          <p className="helper-text">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthCard;
