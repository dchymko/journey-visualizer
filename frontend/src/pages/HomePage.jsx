import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { authenticated, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Kit Journey Visualizer</h1>
        <p style={styles.subtitle}>
          Visualize how your subscribers move through tags, sequences, and automations
        </p>

        <div style={styles.features}>
          <div className="card" style={styles.featureCard}>
            <h3>📊 Interactive Visualization</h3>
            <p>See the complete journey of your subscribers with interactive flow diagrams</p>
          </div>
          <div className="card" style={styles.featureCard}>
            <h3>🎯 Identify Bottlenecks</h3>
            <p>Find where subscribers drop off and optimize your funnels</p>
          </div>
          <div className="card" style={styles.featureCard}>
            <h3>📈 Track Patterns</h3>
            <p>Discover the most common paths subscribers take through your content</p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={login} style={styles.loginBtn}>
          Connect with Kit
        </button>

        <p style={styles.note}>
          Securely connect your Kit account using OAuth 2.0
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '900px',
    color: 'white',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '1rem',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '1.25rem',
    marginBottom: '3rem',
    opacity: '0.9',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  featureCard: {
    textAlign: 'left',
  },
  loginBtn: {
    fontSize: '1.125rem',
    padding: '1rem 2.5rem',
    marginBottom: '1rem',
  },
  note: {
    fontSize: '0.875rem',
    opacity: '0.8',
  },
};

export default HomePage;
