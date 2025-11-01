import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { accountAPI, dashboardAPI, journeyAPI } from '../services/api';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, syncRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        accountAPI.getSyncStatus(),
      ]);

      setMetrics(metricsRes.data);
      setSyncStatus(syncRes.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);

      const response = await accountAPI.sync();
      setSuccess(`Sync completed! ${response.data.subscribers} subscribers, ${response.data.tags} tags, ${response.data.sequences} sequences`);

      // Reload data
      await loadDashboardData();
    } catch (err) {
      console.error('Sync error:', err);
      setError('Failed to sync data. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      setSuccess(null);

      const response = await journeyAPI.analyze();
      setSuccess(`Analysis completed! ${response.data.total_flows} journey flows identified`);

      // Reload metrics
      await loadDashboardData();
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze journeys. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div className="container">
          <div style={styles.headerContent}>
            <h1 style={styles.headerTitle}>Kit Journey Visualizer</h1>
            <div style={styles.headerActions}>
              <span style={styles.userEmail}>{user?.email}</span>
              <button className="btn btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={styles.main}>
        <div style={styles.welcome}>
          <h2>Welcome, {user?.name || 'there'}!</h2>
          <p style={styles.welcomeText}>
            Connected to Kit account: <strong>{user?.email}</strong>
          </p>
          {syncStatus?.last_sync_at && (
            <p style={styles.syncInfo}>
              Last synced: {new Date(syncStatus.last_sync_at).toLocaleString()}
            </p>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div style={styles.actions}>
          <button
            className="btn btn-primary"
            onClick={handleSync}
            disabled={syncing}
            style={{ marginRight: '1rem' }}
          >
            {syncing ? 'Syncing...' : 'Sync Data from Kit'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleAnalyze}
            disabled={analyzing || !metrics || metrics.subscribers === 0}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Journeys'}
          </button>
        </div>

        <div style={styles.metricsGrid}>
          <div className="card" style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics?.subscribers || 0}</div>
            <div style={styles.metricLabel}>Subscribers</div>
          </div>
          <div className="card" style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics?.tags || 0}</div>
            <div style={styles.metricLabel}>Tags</div>
          </div>
          <div className="card" style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics?.sequences || 0}</div>
            <div style={styles.metricLabel}>Sequences</div>
          </div>
          <div className="card" style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics?.flows || 0}</div>
            <div style={styles.metricLabel}>Journey Flows</div>
          </div>
        </div>

        <div className="card" style={styles.infoCard}>
          <h3 style={styles.infoTitle}>Getting Started</h3>
          <ol style={styles.steps}>
            <li>Click "Sync Data from Kit" to fetch your subscribers, tags, and sequences</li>
            <li>Once synced, click "Analyze Journeys" to identify subscriber flow patterns</li>
            <li>Journey visualization will be available in the next version!</li>
          </ol>
        </div>

        {syncStatus?.needs_sync && (
          <div className="card" style={styles.warningCard}>
            <strong>⚠️ No data synced yet</strong>
            <p style={{ marginTop: '0.5rem' }}>
              Click "Sync Data from Kit" to get started with your subscriber journey analysis.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '1rem 0',
    marginBottom: '2rem',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userEmail: {
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  main: {
    paddingBottom: '4rem',
  },
  welcome: {
    marginBottom: '2rem',
  },
  welcomeText: {
    color: '#6b7280',
    marginTop: '0.5rem',
  },
  syncInfo: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  },
  actions: {
    marginBottom: '2rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  metricCard: {
    textAlign: 'center',
  },
  metricValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: '0.5rem',
  },
  metricLabel: {
    fontSize: '1rem',
    color: '#6b7280',
  },
  infoCard: {
    marginBottom: '1.5rem',
  },
  infoTitle: {
    marginBottom: '1rem',
  },
  steps: {
    paddingLeft: '1.5rem',
    lineHeight: '1.8',
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    color: '#92400e',
  },
};

export default DashboardPage;
