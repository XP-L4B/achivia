import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/auth'), 1500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="page-center pixel-bg" style={{ justifyContent: 'center' }}>
      <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem' }}>Achivia</h1>
      <p className="auth-tagline">enhance &amp; engage</p>
    </div>
  );
}
