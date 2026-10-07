import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type TimeFilter,
  type AnalyticsEvent,
  getStoredEvents,
  subscribeToAnalytics,
  calculateOverviewMetrics,
  calculateUsageMetrics,
  calculateBrainResetMetrics,
  calculateFunnelMetrics,
  clearAnalyticsData,
  generateTestSandboxData,
  filterEventsByTime,
} from '../services/analytics';
import './admin.css';

// -------------------------------------------------------------
// Admin Authentication Interface & Ready-for-Backend Hook
// As requested in Section 10: Keep authentication layer ready
import { useAdminAuth } from './auth';

interface AdminDashboardProps {
  onNavigateHome?: () => void;
}

export function AdminDashboard({ onNavigateHome }: AdminDashboardProps) {
  // Extensible admin authentication session
  const auth = useAdminAuth();
  const [filter, setFilter] = useState<TimeFilter>('today');
  const [events, setEvents] = useState<AnalyticsEvent[]>(() => getStoredEvents());
  const [lastRefreshed, setLastRefreshed] = useState<number>(() => Date.now());
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state whenever analytics storage changes
  const refreshData = useCallback(() => {
    setEvents(getStoredEvents());
    setLastRefreshed(Date.now());
  }, []);

  useEffect(() => {
    // Subscribe to internal analytics change broadcast
    const unsubscribe = subscribeToAnalytics(refreshData);

    // Also listen to storage events across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'scrollstop_analytics_events') {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('scrollstop:event_tracked', refreshData);

    // Auto-refresh active visitors every 15 seconds
    const interval = setInterval(refreshData, 15000);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('scrollstop:event_tracked', refreshData);
      clearInterval(interval);
    };
  }, [refreshData]);

  // Ensure full page scrolling on admin dashboard across all devices/browsers
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevBodyHeight = body.style.height;
    const prevBodySelect = body.style.userSelect;
    const prevRootHeight = root?.style.height ?? '';

    html.style.overflow = 'auto';
    html.style.height = 'auto';
    body.style.overflow = 'auto';
    body.style.height = 'auto';
    body.style.userSelect = 'auto';
    if (root) {
      root.style.height = 'auto';
      root.style.minHeight = '100vh';
      root.style.overflow = 'visible';
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      html.style.height = prevHtmlHeight;
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      body.style.userSelect = prevBodySelect;
      if (root) {
        root.style.height = prevRootHeight;
        root.style.minHeight = '';
        root.style.overflow = '';
      }
    };
  }, []);

  // Compute metrics based on time filter
  const overview = useMemo(
    () => calculateOverviewMetrics(events, filter, lastRefreshed),
    [events, filter, lastRefreshed],
  );

  const filteredEvents = useMemo(
    () => filterEventsByTime(events, filter, lastRefreshed),
    [events, filter, lastRefreshed],
  );

  const usage = useMemo(
    () => calculateUsageMetrics(filteredEvents),
    [filteredEvents],
  );

  const brainReset = useMemo(
    () => calculateBrainResetMetrics(filteredEvents),
    [filteredEvents],
  );

  const funnel = useMemo(
    () => calculateFunnelMetrics(filteredEvents),
    [filteredEvents],
  );

  const recentEvents = useMemo(() => {
    return [...events].reverse().slice(0, 10);
  }, [events]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClear = () => {
    if (window.confirm('Clear all recorded anonymous analytics events?')) {
      clearAnalyticsData();
      refreshData();
      showToast('All analytics events cleared.');
    }
  };

  const handleGenerateSandbox = () => {
    generateTestSandboxData(50);
    refreshData();
    showToast('Generated 50 sample testing events.');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scrollstop_analytics_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Find max activity starts for scaling bars in Brain Reset section
  const maxActivityStarts = Math.max(
    1,
    brainReset.urgeSurfing.starts,
    brainReset.breathe.starts,
    brainReset.focus.starts,
    brainReset.numberHunt.starts,
  );

  return (
    <div className="admin-body">
      <div className="admin-layout">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-brand-col">
            <div className="admin-title-row">
              <h1 className="admin-title">SCROLLSTOP ADMIN</h1>
              <div className="admin-live-badge" title="Approximate active sessions in the last 5 minutes">
                <span className="live-pulse-dot" />
                <span>
                  {overview.activeVisitorsNow === 0
                    ? '0 Active Visitors'
                    : `${overview.activeVisitorsNow} Active Now`}
                </span>
              </div>
            </div>
            <p className="admin-subtitle">
              Anonymous usage telemetry &amp; behavioral insights
              {auth.adminUser ? ` · Authenticated: ${auth.adminUser.role}` : ''}
            </p>
          </div>

          <div className="admin-controls-row">
            {/* Date Filter */}
            <div className="admin-filter-bar" role="group" aria-label="Date Filter">
              <button
                type="button"
                className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
                onClick={() => setFilter('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === '7d' ? 'active' : ''}`}
                onClick={() => setFilter('7d')}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === '30d' ? 'active' : ''}`}
                onClick={() => setFilter('30d')}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Time
              </button>
            </div>

            <button
              type="button"
              className="admin-action-btn"
              onClick={refreshData}
              title="Refresh Analytics"
            >
              ↻ Refresh
            </button>

            {onNavigateHome && (
              <button
                type="button"
                className="admin-action-btn"
                onClick={onNavigateHome}
              >
                ← Public App
              </button>
            )}
          </div>
        </header>

        {notification && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#000000',
              color: '#ffffff',
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {notification}
          </div>
        )}

        {/* 1. OVERVIEW SECTION */}
        <section className="admin-section" aria-labelledby="section-overview">
          <div className="section-header">
            <h2 id="section-overview" className="section-title">Overview</h2>
            <span className="section-hint">
              Filter: {filter === 'today' ? 'Today' : filter === '7d' ? 'Last 7 Days' : filter === '30d' ? 'Last 30 Days' : 'All Time'}
            </span>
          </div>

          <div className="cards-grid-6">
            <div className="metric-card">
              <span className="metric-label">Visitors Today</span>
              <span className="metric-value">{overview.visitorsToday}</span>
              <span className="metric-subtext">Unique visitors</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Unique Visitors</span>
              <span className="metric-value">{overview.uniqueVisitors}</span>
              <span className="metric-subtext">Selected period</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Active Visitors</span>
              <span className="metric-value">{overview.activeVisitorsNow}</span>
              <span className="metric-subtext">Last 5 minutes</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Total Sessions</span>
              <span className="metric-value">{overview.totalSessions}</span>
              <span className="metric-subtext">Selected period</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Visitors This Week</span>
              <span className="metric-value">{overview.visitorsThisWeek}</span>
              <span className="metric-subtext">Since Monday</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Visitors This Month</span>
              <span className="metric-value">{overview.visitorsThisMonth}</span>
              <span className="metric-subtext">Calendar month</span>
            </div>
          </div>
        </section>

        {/* 2. SCROLLSTOP USAGE SECTION */}
        <section className="admin-section" aria-labelledby="section-usage">
          <div className="section-header">
            <h2 id="section-usage" className="section-title">SCROLLSTOP Usage</h2>
            <span className="section-hint">Event milestones</span>
          </div>

          <div className="usage-dashboard-box">
            <div className="cards-grid-5">
              <div className="metric-card">
                <span className="metric-label">Sessions Started</span>
                <span className="metric-value">{usage.sessionsStarted}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">30s Scroll Completed</span>
                <span className="metric-value">{usage.scrollCompleted}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Goals Entered</span>
                <span className="metric-value">{usage.goalsEntered}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Brain Reset Opened</span>
                <span className="metric-value">{usage.brainResetOpened}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Completed Sessions</span>
                <span className="metric-value">{usage.completedSessions}</span>
              </div>
            </div>

            <div className="rates-row">
              <div className="rate-card">
                <div className="rate-header">
                  <span className="rate-title">Brain Reset Usage Rate</span>
                  <span className="rate-percent">{usage.brainResetUsageRate}%</span>
                </div>
                <div className="rate-progress-bar">
                  <div
                    className="rate-progress-fill"
                    style={{ width: `${Math.min(100, usage.brainResetUsageRate)}%` }}
                  />
                </div>
                <div className="rate-formula">
                  Brain Reset Opened ({usage.brainResetOpened}) ÷ Sessions Started ({usage.sessionsStarted})
                </div>
              </div>

              <div className="rate-card">
                <div className="rate-header">
                  <span className="rate-title">Session Completion Rate</span>
                  <span className="rate-percent">{usage.sessionCompletionRate}%</span>
                </div>
                <div className="rate-progress-bar">
                  <div
                    className="rate-progress-fill"
                    style={{ width: `${Math.min(100, usage.sessionCompletionRate)}%` }}
                  />
                </div>
                <div className="rate-formula">
                  Completed Sessions ({usage.completedSessions}) ÷ Sessions Started ({usage.sessionsStarted})
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 & 4. BRAIN RESET & ACTIVITY FUNNEL (TWO COLUMN SPLIT ON DESKTOP) */}
        <div className="dashboard-split-2">
          {/* 3. BRAIN RESET ANALYTICS */}
          <section className="admin-section" aria-labelledby="section-brain-reset">
            <div className="section-header">
              <h2 id="section-brain-reset" className="section-title">Brain Reset Analytics</h2>
              <span className="section-hint">Total: {brainReset.totalStarted}</span>
            </div>

            <div className="brain-reset-card">
              <div className="brain-reset-grid">
                {/* Urge Surfing (Highlighted / Featured) */}
                <div className="activity-box featured">
                  <span className="featured-badge">Featured Activity</span>
                  <div className="activity-header">
                    <h3 className="activity-name">Urge Surfing</h3>
                  </div>
                  <div className="activity-starts-count">
                    {brainReset.urgeSurfing.starts}
                  </div>
                  <div className="activity-bar-wrapper">
                    <div
                      className="activity-bar-fill"
                      style={{
                        width: `${(brainReset.urgeSurfing.starts / maxActivityStarts) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="activity-meta-row">
                    <span>Completed: {brainReset.urgeSurfing.completions}</span>
                    <span>
                      {brainReset.urgeSurfing.starts > 0
                        ? `${Math.round(
                            (brainReset.urgeSurfing.completions /
                              brainReset.urgeSurfing.starts) *
                              100,
                          )}% done`
                        : '0% done'}
                    </span>
                  </div>
                </div>

                {/* Breathe */}
                <div className="activity-box">
                  <div className="activity-header">
                    <h3 className="activity-name">Breathe</h3>
                  </div>
                  <div className="activity-starts-count">
                    {brainReset.breathe.starts}
                  </div>
                  <div className="activity-bar-wrapper">
                    <div
                      className="activity-bar-fill"
                      style={{
                        width: `${(brainReset.breathe.starts / maxActivityStarts) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="activity-meta-row">
                    <span>Completed: {brainReset.breathe.completions}</span>
                    <span>
                      {brainReset.breathe.starts > 0
                        ? `${Math.round(
                            (brainReset.breathe.completions /
                              brainReset.breathe.starts) *
                              100,
                          )}% done`
                        : '0% done'}
                    </span>
                  </div>
                </div>

                {/* Focus */}
                <div className="activity-box">
                  <div className="activity-header">
                    <h3 className="activity-name">Focus</h3>
                  </div>
                  <div className="activity-starts-count">
                    {brainReset.focus.starts}
                  </div>
                  <div className="activity-bar-wrapper">
                    <div
                      className="activity-bar-fill"
                      style={{
                        width: `${(brainReset.focus.starts / maxActivityStarts) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="activity-meta-row">
                    <span>Completed: {brainReset.focus.completions}</span>
                    <span>
                      {brainReset.focus.starts > 0
                        ? `${Math.round(
                            (brainReset.focus.completions /
                              brainReset.focus.starts) *
                              100,
                          )}% done`
                        : '0% done'}
                    </span>
                  </div>
                </div>

                {/* Number Hunt */}
                <div className="activity-box">
                  <div className="activity-header">
                    <h3 className="activity-name">Number Hunt</h3>
                  </div>
                  <div className="activity-starts-count">
                    {brainReset.numberHunt.starts}
                  </div>
                  <div className="activity-bar-wrapper">
                    <div
                      className="activity-bar-fill"
                      style={{
                        width: `${(brainReset.numberHunt.starts / maxActivityStarts) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="activity-meta-row">
                    <span>Completed: {brainReset.numberHunt.completions}</span>
                    <span>
                      {brainReset.numberHunt.starts > 0
                        ? `${Math.round(
                            (brainReset.numberHunt.completions /
                              brainReset.numberHunt.starts) *
                              100,
                          )}% done`
                        : '0% done'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. ACTIVITY FUNNEL */}
          <section className="admin-section" aria-labelledby="section-funnel">
            <div className="section-header">
              <h2 id="section-funnel" className="section-title">Activity Funnel</h2>
              <span className="section-hint">Step drop-off analysis</span>
            </div>

            <div className="funnel-card">
              <div className="funnel-steps-container">
                {funnel.map((item, idx) => {
                  const dropOff = idx > 0 ? 100 - item.stepConversion : 0;
                  return (
                    <div key={item.step} className="funnel-step-row">
                      <div className="funnel-step-meta">
                        <span className="funnel-step-title">{item.step}</span>
                        <div className="funnel-step-numbers">
                          <span className="funnel-count">{item.count}</span>
                          <span className="funnel-pct">({item.conversionFromFirst}%)</span>
                          {idx > 0 && dropOff > 0 && (
                            <span className="funnel-dropoff">-{dropOff.toFixed(1)}%</span>
                          )}
                        </div>
                      </div>
                      <div className="funnel-bar-bg">
                        <div
                          className="funnel-bar-inner"
                          style={{
                            width: `${Math.min(100, item.conversionFromFirst)}%`,
                            opacity: 1 - idx * 0.08,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* 5. RECENT ANONYMOUS EVENTS STREAM */}
        <section className="admin-section" aria-labelledby="section-stream">
          <div className="section-header">
            <h2 id="section-stream" className="section-title">Live Anonymous Event Stream</h2>
            <span className="section-hint">Last 10 events</span>
          </div>

          <div className="events-table-wrapper">
            {recentEvents.length === 0 ? (
              <div className="empty-state-box">
                <p className="empty-state-title">No events recorded yet</p>
                <p className="empty-state-desc">
                  When visitors use SCROLLSTOP, anonymous telemetry events will appear here in real time.
                </p>
              </div>
            ) : (
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Session ID</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((evt) => (
                    <tr key={evt.id}>
                      <td className="event-time">{formatTime(evt.timestamp)}</td>
                      <td>
                        <span
                          className={`event-badge ${
                            evt.event_name.startsWith('urge_surfing') ? 'featured' : ''
                          }`}
                        >
                          {evt.event_name}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#777777' }}>
                        {evt.anonymous_session_id.slice(0, 16)}…
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{evt.device_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* 6. DEVELOPER DIAGNOSTICS & SANDBOX (CLEARLY ISOLATED) */}
        <div className="dev-sandbox-card">
          <div className="dev-sandbox-header">
            <h3 className="dev-sandbox-title">Development Sandbox &amp; Diagnostics</h3>
            <p className="dev-sandbox-desc">
              Tools to verify dashboard computations during development without mixing fake numbers with production data.
            </p>
          </div>
          <div className="dev-actions-row">
            <button
              type="button"
              className="dev-btn"
              onClick={handleGenerateSandbox}
            >
              + Generate 50 Test Events
            </button>
            <button
              type="button"
              className="dev-btn"
              onClick={handleExportJson}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="dev-btn danger"
              onClick={handleClear}
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
