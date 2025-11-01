import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Authentication Error</h1>
        <p style={styles.message}>
          There was a problem connecting to your Kit account. Please try again.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Go Home
        </button>
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
    padding: '2rem',
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#ef4444',
  },
  message: {
    marginBottom: '2rem',
    color: '#6b7280',
  },
};

export default ErrorPage;
