import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { fetchProfileActiveHome, persistActiveHome } from "../utils/activeHome";

/**
 * SmartHomeContext / SmartHomeProvider (Designer)
 *
 * Manages the active DigitalHome selection. Homes are fetched via
 * listDigitalHomes when authenticated. The active selection is persisted to
 * the backend (UserProfile.activeSmartHomeId) so it is SHARED ACROSS APPS —
 * pick a home here and the Designer picks it up on its next load, and vice
 * versa. localStorage + the `?home=` query param are fast local hints.
 *
 * Selection precedence on load: ?home= → backend activeSmartHomeId →
 * localStorage → single-home auto-select → first.
 */

const STORAGE_KEY = "dhc-active-home";

// Always-false stub kept for any consumer that imports it (demos removed in v2).
export const isDemoSmartHome = () => false;

const SmartHomeContext = createContext(null);

export const SmartHomeProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const isBrowser = typeof window !== "undefined";

  // Whether this page load carried an explicit ?home= (wins over the backend).
  const urlHomeRef = useRef(null);

  const [activeHomeId, setActiveHomeId] = useState(() => {
    if (!isBrowser) return null;
    const fromUrl = new URLSearchParams(window.location.search).get("home");
    if (fromUrl) {
      urlHomeRef.current = fromUrl;
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(STORAGE_KEY);
  });

  const [userHomes, setUserHomes] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const initializedRef = useRef(false);

  // Fetch the user's homes.
  useEffect(() => {
    if (!isAuthenticated || !isBrowser) return;
    let cancelled = false;
    (async () => {
      try {
        const { generateClient } = await import("aws-amplify/api");
        const { listDigitalHomes } = await import("../graphql/queries");
        const client = generateClient();
        const result = await client.graphql({ query: listDigitalHomes });
        if (cancelled) return;
        const homes = (result.data.listDigitalHomes.items || []).map((h) => ({
          id: h.smartHomeId,
          name:
            [h.addressLine1, h.city].filter(Boolean).join(", ") || h.smartHomeId,
          isDemo: !!h.isDemo,
        }));
        setUserHomes(homes);
      } catch (err) {
        console.warn("[SmartHomeContext] Failed to fetch DigitalHomes:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isBrowser]);

  // Read the persisted selection once; adopt it unless ?home= overrode this load.
  useEffect(() => {
    if (!isAuthenticated || !isBrowser || initializedRef.current) return;
    const owner = user?.username;
    if (!owner) return;
    initializedRef.current = true;
    (async () => {
      const profile = await fetchProfileActiveHome(owner);
      if (!profile) return;
      setProfileId(profile.profileId);
      if (!urlHomeRef.current && profile.activeSmartHomeId) {
        setActiveHomeId(profile.activeSmartHomeId);
        localStorage.setItem(STORAGE_KEY, profile.activeSmartHomeId);
      }
    })();
  }, [isAuthenticated, isBrowser, user]);

  const NO_HOME = { id: "", name: "(no home selected)", isDemo: false };
  const activeHome =
    userHomes.find((h) => h.id === activeHomeId) ||
    (userHomes.length > 0 ? userHomes[0] : NO_HOME);

  const setActiveHome = useCallback(
    (id) => {
      setActiveHomeId(id);
      if (isBrowser) {
        if (id) localStorage.setItem(STORAGE_KEY, id);
        else localStorage.removeItem(STORAGE_KEY);
      }
      // Persist to the backend so other apps pick it up. Fire-and-forget;
      // capture a newly-created profile id for subsequent updates.
      if (isAuthenticated) {
        persistActiveHome(profileId, id).then((pid) => {
          if (pid && pid !== profileId) setProfileId(pid);
        });
      }
    },
    [isBrowser, isAuthenticated, profileId]
  );

  // Auto-select when there's exactly one home and nothing chosen yet.
  useEffect(() => {
    if (!activeHomeId && userHomes.length === 1) {
      setActiveHome(userHomes[0].id);
    }
  }, [userHomes, activeHomeId, setActiveHome]);

  // If the stored selection is no longer in the list, reset to the first.
  useEffect(() => {
    if (
      activeHomeId &&
      userHomes.length > 0 &&
      !userHomes.find((h) => h.id === activeHomeId)
    ) {
      setActiveHome(userHomes[0].id);
    }
  }, [userHomes, activeHomeId, setActiveHome]);

  const value = {
    smartHomes: userHomes,
    demoHomes: [],
    userHomes,
    activeHome,
    activeHomeId,
    setActiveHome,
    isDemo: activeHome?.isDemo ?? false,
  };

  return (
    <SmartHomeContext.Provider value={value}>
      {children}
    </SmartHomeContext.Provider>
  );
};

export const useSmartHome = () => {
  const ctx = useContext(SmartHomeContext);
  if (!ctx) {
    throw new Error("useSmartHome must be used within a SmartHomeProvider");
  }
  return ctx;
};
