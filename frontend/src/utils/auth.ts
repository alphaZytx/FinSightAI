const TOKEN_KEY = 'mafrs_token';
const USER_KEY = 'mafrs_user';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

// --------------------------------------------------------------------------- #
// Token storage                                                                #
// --------------------------------------------------------------------------- #

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string, remember: boolean): void {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

// --------------------------------------------------------------------------- #
// User profile storage                                                         #
// --------------------------------------------------------------------------- #

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveUser(user: AuthUser, remember: boolean): void {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// --------------------------------------------------------------------------- #
// Session helpers                                                              #
// --------------------------------------------------------------------------- #

export function saveSession(token: string, user: AuthUser, remember: boolean): void {
  saveToken(token, remember);
  saveUser(user, remember);
}

export function clearSession(): void {
  clearToken();
  clearUser();
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function getSession(): { name: string; email: string } | null {
  const user = getUser();
  if (!user) return null;
  return { name: user.full_name, email: user.email };
}
