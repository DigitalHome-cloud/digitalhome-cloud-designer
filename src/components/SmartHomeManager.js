import React from "react";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";
import { getAppUrl } from "../utils/getAppUrl";

// Read-only home selector. Creating / editing / deleting Digital Homes and
// managing device inventory now live in the Portal (the central admin surface);
// the Designer only lists the user's homes and lets them pick the active one.
const SmartHomeManager = () => {
  const { authState, isAuthenticated } = useAuth();
  const { userHomes, activeHome, setActiveHome } = useSmartHome();

  const portalManagerUrl = `${getAppUrl("portal")}/manager`;

  const renderIdCell = (id) => {
    const isActive = activeHome?.id === id;
    return (
      <button
        type="button"
        className={`dhc-home-pick${isActive ? " dhc-home-pick--active" : ""}`}
        onClick={() => setActiveHome(id)}
      >
        <span className="dhc-home-pick-check" aria-hidden="true">
          {isActive ? "✓" : ""}
        </span>
        <span className="dhc-home-pick-id">{id}</span>
      </button>
    );
  };

  return (
    <div className="dhc-manager-list">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <a
          href={portalManagerUrl}
          className="dhc-button-primary"
          target="_blank"
          rel="noreferrer"
        >
          + Create a home in the Portal →
        </a>
      </div>

      {!isAuthenticated ? (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          Sign in to see and select your Digital Homes.
        </p>
      ) : userHomes.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          You have no Digital Homes yet. Create one in the Portal, then return
          here to design it.
        </p>
      ) : (
        <table className="dhc-manager-table">
          <thead>
            <tr>
              <th>SmartHome ID</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {userHomes.map((home) => (
              <tr key={home.id}>
                <td>{renderIdCell(home.id)}</td>
                <td>{home.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {authState === "authenticated" && userHomes.length > 1 && (
        <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.75rem" }}>
          Click a SmartHome ID to make it the active home. Your choice is saved
          to your profile and shared across the Portal and Designer.
        </p>
      )}
    </div>
  );
};

export default SmartHomeManager;
