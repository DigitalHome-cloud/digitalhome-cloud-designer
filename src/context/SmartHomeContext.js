import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

/**
 * SmartHomeContext / SmartHomeProvider
 *
 * Manages the active SmartHome selection. Three demo SmartHomes are
 * always available. When the backend SmartHome model is added, user-linked
 * homes will be fetched via GraphQL and merged in.
 *
 * Persists the active selection to localStorage.
 */

const STORAGE_KEY = "dhc-active-home";

const DEMO_HOMES = [
  { id: "DE-DEMO", name: "Demo Germany", isDemo: true },
  { id: "FR-DEMO", name: "Demo France", isDemo: true },
  { id: "BE-DEMO", name: "Demo Belgium", isDemo: true },
];

const SmartHomeContext = createContext(null);

export const SmartHomeProvider = ({ children }) => {
  const { authState } = useAuth();
  const isBrowser = typeof window !== "undefined";

  const [activeHomeId, setActiveHomeId] = useState(() => {
    if (!isBrowser) return DEMO_HOMES[0].id;
    // Check ?home= query param first (e.g. coming from the portal)
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("home");
    if (fromUrl) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(STORAGE_KEY) || DEMO_HOMES[0].id;
  });

  // TODO: When backend SmartHome model exists, fetch user-linked homes here
  // const [userHomes, setUserHomes] = useState([]);
  const userHomes = [];

  const smartHomes =
    authState === "authenticated"
      ? [...DEMO_HOMES, ...userHomes]
      : [...DEMO_HOMES];

  const activeHome =
    smartHomes.find((h) => h.id === activeHomeId) || smartHomes[0];

  const setActiveHome = useCallback(
    (id) => {
      setActiveHomeId(id);
      if (isBrowser) {
        localStorage.setItem(STORAGE_KEY, id);
      }
    },
    [isBrowser],
  );

  // If the stored selection is no longer in the list, reset to first
  useEffect(() => {
    if (!smartHomes.find((h) => h.id === activeHomeId)) {
      setActiveHome(smartHomes[0].id);
    }
  }, [smartHomes, activeHomeId, setActiveHome]);

  const value = {
    smartHomes,
    demoHomes: DEMO_HOMES,
    userHomes,
    activeHome,
    setActiveHome,
    isDemo: activeHome?.isDemo ?? true,
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
