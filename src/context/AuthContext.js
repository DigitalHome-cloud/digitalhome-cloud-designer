import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchAuthSession,
  getCurrentUser,
  signOut as amplifySignOut,
} from "aws-amplify/auth";

/**
 * AuthContext / AuthProvider
 *
 * Responsibilities:
 * - On client mount, try to load the current Cognito session.
 * - Expose:
 *   - authState: "loading" | "demo" | "authenticated"
 *   - isLoading: boolean
 *   - isAuthenticated: boolean
 *   - user: Cognito user object (or null)
 *   - groups: string[] from ID token ("cognito:groups")
 *   - hasGroup(name): boolean
 *   - reloadSession(): force-refresh from Cognito
 *   - signOut(): sign out via Amplify and reset state
 *
 * Notes:
 * - SSR-safe: never calls Amplify Auth on the server (no window).
 * - Uses fetchAuthSession() + getCurrentUser() so it stays in sync
 *   with the Amplify <Authenticator> component on /signin.
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState("loading"); // "loading" | "demo" | "authenticated"
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);

  const isBrowser = typeof window !== "undefined";

  const loadSession = async () => {
    if (!isBrowser) {
      // On SSR render, don't call Amplify. Client hydration will re-run this.
      setAuthState((prev) => (prev === "loading" ? "demo" : prev));
      return;
    }

    try {
      setAuthState("loading");

      // getCurrentUser() checks local tokens — doesn't need Identity Pool.
      // Call it first so an Identity Pool misconfiguration doesn't break auth.
      const currentUser = await getCurrentUser();

      // User is authenticated. Now try to get the session for group claims.
      let idPayload = {};
      try {
        const session = await fetchAuthSession();
        idPayload = session?.tokens?.idToken?.payload || {};
      } catch (sessionErr) {
        // Identity Pool errors (e.g. DNS resolution) must not block auth.
        console.warn(
          "[AuthContext] fetchAuthSession failed (Identity Pool?), proceeding without token payload:",
          sessionErr
        );
      }

      const tokenGroups = idPayload["cognito:groups"] || [];

      setUser({
        ...currentUser,
        idTokenPayload: idPayload,
      });
      setGroups(tokenGroups);
      setAuthState("authenticated");
    } catch (err) {
      console.warn("[AuthContext] No valid session, using DEMO mode:", err);
      setUser(null);
      setGroups([]);
      setAuthState("demo");
    }
  };

  useEffect(() => {
    // Run once on client mount
    if (!isBrowser) {
      // SSR: do nothing; initial state will stay "loading" until hydration.
      return;
    }
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    try {
      await amplifySignOut();
    } catch (err) {
      console.error("[AuthContext] Error during sign-out:", err);
    } finally {
      // Regardless of error, reset local auth state
      setUser(null);
      setGroups([]);
      setAuthState("demo");
    }
  };

  const value = {
    authState,
    isLoading: authState === "loading",
    isAuthenticated: authState === "authenticated",
    user,
    groups,
    hasGroup: (g) => groups.includes(g),
    reloadSession: loadSession,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
