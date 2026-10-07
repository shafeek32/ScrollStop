// -------------------------------------------------------------
// Admin Authentication Interface & Ready-for-Backend Hook
// As requested in Section 10: Keep authentication layer ready
// to be connected to the real authentication system (JWT, OAuth,
// Supabase, Firebase, or server session) without fake passwords.
// -------------------------------------------------------------

export interface AdminAuthSession {
  isAuthenticated: boolean;
  adminUser?: {
    id: string;
    role: string;
  };
}

export function useAdminAuth(): AdminAuthSession {
  // Currently allows direct access in dev/standalone environment.
  // When a backend authentication service or token is connected,
  // simply plug the check or hook here:
  // e.g.:
  // const token = localStorage.getItem('admin_token');
  // return { isAuthenticated: Boolean(token), ... };
  return {
    isAuthenticated: true,
    adminUser: {
      id: 'admin_local',
      role: 'administrator',
    },
  };
}
