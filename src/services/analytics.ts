// -------------------------------------------------------------
// SCROLLSTOP — Anonymous Usage Analytics Service
// Strictly anonymous: No PII, no names, no emails, no goal texts.
// -------------------------------------------------------------

export type EventName =
  | 'page_visit'
  | 'session_started'
  | 'scroll_started'
  | 'scroll_completed'
  | 'goal_entered'
  | 'brain_reset_opened'
  | 'urge_surfing_started'
  | 'urge_surfing_completed'
  | 'breathe_started'
  | 'breathe_completed'
  | 'focus_started'
  | 'focus_completed'
  | 'number_hunt_started'
  | 'number_hunt_completed'
  | 'commitment_yes'
  | 'commitment_no'
  | 'session_completed';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface AnalyticsEvent {
  id: string;
  event_name: EventName;
  anonymous_session_id: string;
  anonymous_visitor_id: string;
  timestamp: number;
  device_type: DeviceType;
}

export type TimeFilter = 'today' | '7d' | '30d' | 'all';

const STORAGE_KEY_EVENTS = 'scrollstop_analytics_events';
const STORAGE_KEY_VISITOR = 'scrollstop_anon_visitor_id';
const SESSION_KEY = 'scrollstop_anon_session_id';

// Coarse device detection without collecting personal metadata
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

// Generate anonymous random identifier
function generateRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
}

// Get or create persistent anonymous visitor ID (stored in localStorage)
export function getAnonymousVisitorId(): string {
  if (typeof window === 'undefined') return 'anon_visitor_ssr';
  let visitorId = localStorage.getItem(STORAGE_KEY_VISITOR);
  if (!visitorId) {
    visitorId = generateRandomId('v');
    localStorage.setItem(STORAGE_KEY_VISITOR, visitorId);
  }
  return visitorId;
}

// Get or create per-session anonymous session ID (stored in sessionStorage)
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return 'anon_session_ssr';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateRandomId('s');
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Reset session ID when a new distinct session begins
export function startNewAnonymousSession(): string {
  const newSessionId = generateRandomId('s');
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, newSessionId);
  }
  return newSessionId;
}

// In-memory cache + change listeners
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying analytics listener:', e);
    }
  });
}

export function subscribeToAnalytics(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Retrieve raw events safely from localStorage
export function getStoredEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (!raw) return [];
    return JSON.parse(raw) as AnalyticsEvent[];
  } catch (err) {
    console.error('Failed to parse analytics events:', err);
    return [];
  }
}

// Save events array to localStorage (capped at 10,000 to manage storage)
function saveEvents(events: AnalyticsEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    const capped = events.slice(-10000);
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(capped));
    notifyListeners();
  } catch (err) {
    console.error('Failed to save analytics events:', err);
  }
}

// Track an anonymous event
export function trackEvent(eventName: EventName): AnalyticsEvent {
  const event: AnalyticsEvent = {
    id: generateRandomId('evt'),
    event_name: eventName,
    anonymous_session_id: getAnonymousSessionId(),
    anonymous_visitor_id: getAnonymousVisitorId(),
    timestamp: Date.now(),
    device_type: getDeviceType(),
  };

  const existing = getStoredEvents();
  existing.push(event);
  saveEvents(existing);

  // Dispatch storage event so tabs sync in real-time
  try {
    window.dispatchEvent(new Event('scrollstop:event_tracked'));
  } catch {
    // Ignore in non-window envs
  }

  return event;
}

// Helper to filter events by time range
export function filterEventsByTime(
  events: AnalyticsEvent[],
  filter: TimeFilter,
  referenceNow = Date.now(),
): AnalyticsEvent[] {
  if (filter === 'all') return events;

  const now = new Date(referenceNow);

  if (filter === 'today') {
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    ).getTime();
    return events.filter((e) => e.timestamp >= startOfToday);
  }

  if (filter === '7d') {
    const sevenDaysAgo = referenceNow - 7 * 24 * 60 * 60 * 1000;
    return events.filter((e) => e.timestamp >= sevenDaysAgo);
  }

  if (filter === '30d') {
    const thirtyDaysAgo = referenceNow - 30 * 24 * 60 * 60 * 1000;
    return events.filter((e) => e.timestamp >= thirtyDaysAgo);
  }

  return events;
}

// -------------------------------------------------------------
// METRIC CALCULATIONS
// -------------------------------------------------------------

export interface OverviewMetrics {
  visitorsToday: number;
  uniqueVisitors: number;
  visitorsThisWeek: number;
  visitorsThisMonth: number;
  activeVisitorsNow: number;
  totalSessions: number;
}

export function calculateOverviewMetrics(
  allEvents: AnalyticsEvent[],
  filter: TimeFilter,
  referenceNow = Date.now(),
): OverviewMetrics {
  const now = new Date(referenceNow);

  // Start of today (00:00:00)
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();

  // Start of this week (Monday 00:00:00)
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - dayOfWeek,
    0,
    0,
    0,
    0,
  ).getTime();

  // Start of this month (1st 00:00:00)
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  ).getTime();

  // Active sessions within last 5 minutes (approximate active session count)
  const fiveMinAgo = referenceNow - 5 * 60 * 1000;

  // Filtered slice for the current time filter view
  const filtered = filterEventsByTime(allEvents, filter, referenceNow);

  // Visitors Today
  const visitorsTodaySet = new Set<string>();
  allEvents.forEach((e) => {
    if (e.timestamp >= startOfToday) {
      visitorsTodaySet.add(e.anonymous_visitor_id);
    }
  });

  // Unique Visitors in selected filter
  const uniqueVisitorsSet = new Set<string>();
  filtered.forEach((e) => {
    uniqueVisitorsSet.add(e.anonymous_visitor_id);
  });

  // Visitors This Week
  const visitorsThisWeekSet = new Set<string>();
  allEvents.forEach((e) => {
    if (e.timestamp >= startOfWeek) {
      visitorsThisWeekSet.add(e.anonymous_visitor_id);
    }
  });

  // Visitors This Month
  const visitorsThisMonthSet = new Set<string>();
  allEvents.forEach((e) => {
    if (e.timestamp >= startOfMonth) {
      visitorsThisMonthSet.add(e.anonymous_visitor_id);
    }
  });

  // Active sessions now (last 5 min)
  const activeSessionsSet = new Set<string>();
  allEvents.forEach((e) => {
    if (e.timestamp >= fiveMinAgo) {
      activeSessionsSet.add(e.anonymous_session_id);
    }
  });

  // Total sessions in selected filter
  const totalSessionsSet = new Set<string>();
  filtered.forEach((e) => {
    totalSessionsSet.add(e.anonymous_session_id);
  });

  return {
    visitorsToday: visitorsTodaySet.size,
    uniqueVisitors: uniqueVisitorsSet.size,
    visitorsThisWeek: visitorsThisWeekSet.size,
    visitorsThisMonth: visitorsThisMonthSet.size,
    activeVisitorsNow: activeSessionsSet.size,
    totalSessions: totalSessionsSet.size,
  };
}

export interface UsageMetrics {
  sessionsStarted: number;
  scrollCompleted: number;
  goalsEntered: number;
  brainResetOpened: number;
  completedSessions: number;
  brainResetUsageRate: number; // Percentage 0 - 100
  sessionCompletionRate: number; // Percentage 0 - 100
}

export function calculateUsageMetrics(events: AnalyticsEvent[]): UsageMetrics {
  let sessionsStarted = 0;
  let scrollCompleted = 0;
  let goalsEntered = 0;
  let brainResetOpened = 0;
  let completedSessions = 0;

  events.forEach((e) => {
    if (e.event_name === 'session_started') sessionsStarted++;
    else if (e.event_name === 'scroll_completed') scrollCompleted++;
    else if (e.event_name === 'goal_entered') goalsEntered++;
    else if (e.event_name === 'brain_reset_opened') brainResetOpened++;
    else if (e.event_name === 'session_completed') completedSessions++;
  });

  const brainResetUsageRate =
    sessionsStarted > 0
      ? Math.round((brainResetOpened / sessionsStarted) * 1000) / 10
      : 0;

  const sessionCompletionRate =
    sessionsStarted > 0
      ? Math.round((completedSessions / sessionsStarted) * 1000) / 10
      : 0;

  return {
    sessionsStarted,
    scrollCompleted,
    goalsEntered,
    brainResetOpened,
    completedSessions,
    brainResetUsageRate,
    sessionCompletionRate,
  };
}

export interface ActivityCount {
  name: string;
  starts: number;
  completions: number;
  isMain?: boolean;
}

export interface BrainResetMetrics {
  urgeSurfing: ActivityCount;
  breathe: ActivityCount;
  focus: ActivityCount;
  numberHunt: ActivityCount;
  totalStarted: number;
}

export function calculateBrainResetMetrics(
  events: AnalyticsEvent[],
): BrainResetMetrics {
  const result: BrainResetMetrics = {
    urgeSurfing: {
      name: 'Urge Surfing',
      starts: 0,
      completions: 0,
      isMain: true,
    },
    breathe: {
      name: 'Breathe',
      starts: 0,
      completions: 0,
    },
    focus: {
      name: 'Focus',
      starts: 0,
      completions: 0,
    },
    numberHunt: {
      name: 'Number Hunt',
      starts: 0,
      completions: 0,
    },
    totalStarted: 0,
  };

  events.forEach((e) => {
    switch (e.event_name) {
      case 'urge_surfing_started':
        result.urgeSurfing.starts++;
        result.totalStarted++;
        break;
      case 'urge_surfing_completed':
        result.urgeSurfing.completions++;
        break;
      case 'breathe_started':
        result.breathe.starts++;
        result.totalStarted++;
        break;
      case 'breathe_completed':
        result.breathe.completions++;
        break;
      case 'focus_started':
        result.focus.starts++;
        result.totalStarted++;
        break;
      case 'focus_completed':
        result.focus.completions++;
        break;
      case 'number_hunt_started':
        result.numberHunt.starts++;
        result.totalStarted++;
        break;
      case 'number_hunt_completed':
        result.numberHunt.completions++;
        break;
    }
  });

  return result;
}

export interface FunnelStep {
  step: string;
  count: number;
  conversionFromFirst: number; // percentage from step 1
  stepConversion: number; // percentage from previous step
}

export function calculateFunnelMetrics(events: AnalyticsEvent[]): FunnelStep[] {
  // Count distinct sessions that reached each stage
  const visitorsSessions = new Set<string>();
  const scrollStartedSessions = new Set<string>();
  const scrollCompletedSessions = new Set<string>();
  const goalEnteredSessions = new Set<string>();
  const brainResetOpenedSessions = new Set<string>();
  const brainResetStartedSessions = new Set<string>();
  const sessionCompletedSessions = new Set<string>();

  events.forEach((e) => {
    const sid = e.anonymous_session_id;
    if (e.event_name === 'page_visit' || e.event_name === 'session_started') {
      visitorsSessions.add(sid);
    }
    if (e.event_name === 'scroll_started') {
      scrollStartedSessions.add(sid);
    }
    if (e.event_name === 'scroll_completed') {
      scrollCompletedSessions.add(sid);
    }
    if (e.event_name === 'goal_entered') {
      goalEnteredSessions.add(sid);
    }
    if (e.event_name === 'brain_reset_opened') {
      brainResetOpenedSessions.add(sid);
    }
    if (
      e.event_name === 'urge_surfing_started' ||
      e.event_name === 'breathe_started' ||
      e.event_name === 'focus_started' ||
      e.event_name === 'number_hunt_started'
    ) {
      brainResetStartedSessions.add(sid);
    }
    if (e.event_name === 'session_completed') {
      sessionCompletedSessions.add(sid);
    }
  });

  const rawSteps = [
    { step: 'Visitors', count: visitorsSessions.size },
    { step: 'Started Scrolling', count: scrollStartedSessions.size },
    { step: 'Completed 30 Seconds', count: scrollCompletedSessions.size },
    { step: 'Entered Goal', count: goalEnteredSessions.size },
    { step: 'Opened Brain Reset', count: brainResetOpenedSessions.size },
    { step: 'Started Brain Reset', count: brainResetStartedSessions.size },
    { step: 'Completed Session', count: sessionCompletedSessions.size },
  ];

  const firstCount = rawSteps[0].count;

  return rawSteps.map((item, idx) => {
    const prevCount = idx === 0 ? item.count : rawSteps[idx - 1].count;
    const conversionFromFirst =
      firstCount > 0 ? Math.round((item.count / firstCount) * 1000) / 10 : 0;
    const stepConversion =
      prevCount > 0 ? Math.round((item.count / prevCount) * 1000) / 10 : 0;

    return {
      step: item.step,
      count: item.count,
      conversionFromFirst,
      stepConversion,
    };
  });
}

// -------------------------------------------------------------
// TESTING & DIAGNOSTICS (SEPARATED DEVELOPMENT HELPERS)
// -------------------------------------------------------------

export function clearAnalyticsData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_EVENTS);
  notifyListeners();
}

/**
 * Generate synthetic testing events clearly tagged for developer sandbox testing.
 * Never confused with production data, as requested in Section 13.
 */
export function generateTestSandboxData(count = 50) {
  const events: AnalyticsEvent[] = [];
  const now = Date.now();
  const devices: DeviceType[] = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet'];

  for (let i = 0; i < count; i++) {
    const sid = `test_session_${i + 1}`;
    const vid = `test_visitor_${(i % 15) + 1}`;
    // Spread over past 5 days
    const timeOffset = Math.random() * 5 * 24 * 60 * 60 * 1000;
    const ts = now - timeOffset;
    const device = devices[Math.floor(Math.random() * devices.length)];

    // Funnel simulation
    events.push({
      id: `evt_test_${i}_1`,
      event_name: 'page_visit',
      anonymous_session_id: sid,
      anonymous_visitor_id: vid,
      timestamp: ts,
      device_type: device,
    });

    events.push({
      id: `evt_test_${i}_2`,
      event_name: 'session_started',
      anonymous_session_id: sid,
      anonymous_visitor_id: vid,
      timestamp: ts + 1000,
      device_type: device,
    });

    if (Math.random() > 0.15) {
      events.push({
        id: `evt_test_${i}_3`,
        event_name: 'scroll_started',
        anonymous_session_id: sid,
        anonymous_visitor_id: vid,
        timestamp: ts + 3000,
        device_type: device,
      });

      if (Math.random() > 0.25) {
        events.push({
          id: `evt_test_${i}_4`,
          event_name: 'scroll_completed',
          anonymous_session_id: sid,
          anonymous_visitor_id: vid,
          timestamp: ts + 33000,
          device_type: device,
        });

        if (Math.random() > 0.1) {
          events.push({
            id: `evt_test_${i}_5`,
            event_name: 'goal_entered',
            anonymous_session_id: sid,
            anonymous_visitor_id: vid,
            timestamp: ts + 42000,
            device_type: device,
          });

          if (Math.random() > 0.1) {
            events.push({
              id: `evt_test_${i}_6`,
              event_name: 'brain_reset_opened',
              anonymous_session_id: sid,
              anonymous_visitor_id: vid,
              timestamp: ts + 55000,
              device_type: device,
            });

            // Activity selection: Urge Surfing is most popular
            const choice = Math.random();
            if (choice < 0.5) {
              events.push({
                id: `evt_test_${i}_7`,
                event_name: 'urge_surfing_started',
                anonymous_session_id: sid,
                anonymous_visitor_id: vid,
                timestamp: ts + 60000,
                device_type: device,
              });
              if (Math.random() > 0.2) {
                events.push({
                  id: `evt_test_${i}_8`,
                  event_name: 'urge_surfing_completed',
                  anonymous_session_id: sid,
                  anonymous_visitor_id: vid,
                  timestamp: ts + 120000,
                  device_type: device,
                });
              }
            } else if (choice < 0.72) {
              events.push({
                id: `evt_test_${i}_7`,
                event_name: 'breathe_started',
                anonymous_session_id: sid,
                anonymous_visitor_id: vid,
                timestamp: ts + 60000,
                device_type: device,
              });
              if (Math.random() > 0.3) {
                events.push({
                  id: `evt_test_${i}_8`,
                  event_name: 'breathe_completed',
                  anonymous_session_id: sid,
                  anonymous_visitor_id: vid,
                  timestamp: ts + 120000,
                  device_type: device,
                });
              }
            } else if (choice < 0.88) {
              events.push({
                id: `evt_test_${i}_7`,
                event_name: 'focus_started',
                anonymous_session_id: sid,
                anonymous_visitor_id: vid,
                timestamp: ts + 60000,
                device_type: device,
              });
              if (Math.random() > 0.2) {
                events.push({
                  id: `evt_test_${i}_8`,
                  event_name: 'focus_completed',
                  anonymous_session_id: sid,
                  anonymous_visitor_id: vid,
                  timestamp: ts + 90000,
                  device_type: device,
                });
              }
            } else {
              events.push({
                id: `evt_test_${i}_7`,
                event_name: 'number_hunt_started',
                anonymous_session_id: sid,
                anonymous_visitor_id: vid,
                timestamp: ts + 60000,
                device_type: device,
              });
              if (Math.random() > 0.25) {
                events.push({
                  id: `evt_test_${i}_8`,
                  event_name: 'number_hunt_completed',
                  anonymous_session_id: sid,
                  anonymous_visitor_id: vid,
                  timestamp: ts + 95000,
                  device_type: device,
                });
              }
            }

            if (Math.random() > 0.2) {
              events.push({
                id: `evt_test_${i}_9`,
                event_name: 'commitment_yes',
                anonymous_session_id: sid,
                anonymous_visitor_id: vid,
                timestamp: ts + 130000,
                device_type: device,
              });

              events.push({
                id: `evt_test_${i}_10`,
                event_name: 'session_completed',
                anonymous_session_id: sid,
                anonymous_visitor_id: vid,
                timestamp: ts + 140000,
                device_type: device,
              });
            } else {
              events.push({
                id: `evt_test_${i}_9`,
                event_name: 'commitment_no',
                anonymous_session_id: sid,
                anonymous_visitor_id: vid,
                timestamp: ts + 130000,
                device_type: device,
              });
            }
          }
        }
      }
    }
  }

  // Also add 2 active sessions in last 2 minutes
  for (let a = 1; a <= 2; a++) {
    const activeSid = `test_active_session_${a}`;
    events.push({
      id: `evt_test_active_${a}`,
      event_name: 'page_visit',
      anonymous_session_id: activeSid,
      anonymous_visitor_id: `test_active_v_${a}`,
      timestamp: now - a * 60 * 1000,
      device_type: 'mobile',
    });
  }

  const existing = getStoredEvents();
  saveEvents([...existing, ...events]);
}
