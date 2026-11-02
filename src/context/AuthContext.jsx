import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthApi, SESSION_EXPIRED_EVENT, clearSession, getAccessToken, getStoredUser, setSession } from "../api";
import { useToast } from "./ToastContext.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const showToast = useToast();
  // A stored user only counts as "logged in" if its token is still there too.
  const [user, setUser] = useState(() => (getAccessToken() ? getStoredUser() : null));

  // The API client fires this when a token refresh fails — drop back to login.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      showToast("Your session expired — please log in again", "error");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [showToast]);

  const login = useCallback(async (identifier, password) => {
    const data = await AuthApi.login(identifier, password);
    setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    // Best effort: the request reads the token synchronously, so clearing the
    // session right after doesn't affect it — and we don't wait on a slow server.
    AuthApi.logout().catch(() => {});
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
