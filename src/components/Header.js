import * as React from "react";
import { Link } from "gatsby";
import { useTranslation, useI18next } from "gatsby-plugin-react-i18next";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";

const Header = () => {
  const { t } = useTranslation();
  const { languages, language, changeLanguage } = useI18next();
  const { authState, isAuthenticated, user, signOut } = useAuth();
  const { demoHomes, userHomes, activeHome, setActiveHome } = useSmartHome();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="dhc-header">
      <div className="dhc-header-inner">
        <div className="dhc-logo">
          <span className="dhc-logo-mark">DH</span>
          <div className="dhc-logo-text">
            <span className="dhc-logo-title">DigitalHome.Cloud</span>
            <span className="dhc-logo-subtitle">Designer</span>
          </div>
        </div>

        <nav className="dhc-nav">
          <div className="dhc-nav-group">
            <Link to="/" className="dhc-nav-link">
              {t("nav.home")}
            </Link>
            <a
              href="https://portal.digitalhome.cloud"
              className="dhc-nav-link"
              target="_blank"
              rel="noreferrer"
            >
              {t("nav.portal")}
            </a>
            <a
              href="https://github.com/DigitalHome-cloud"
              className="dhc-nav-link"
              target="_blank"
              rel="noreferrer"
            >
              {t("nav.github")}
            </a>
          </div>

          {/* SmartHome selector */}
          <div className="dhc-home-selector">
            <select
              className="dhc-home-select"
              value={activeHome.id}
              onChange={(e) => setActiveHome(e.target.value)}
              aria-label={t("smarthome.label")}
            >
              <optgroup label={t("smarthome.demoGroup")}>
                {demoHomes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.id}
                  </option>
                ))}
              </optgroup>
              {userHomes.length > 0 && (
                <optgroup label={t("smarthome.yourHomes")}>
                  {userHomes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.id}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="dhc-nav-group dhc-nav-auth">
            {authState === "demo" && (
              <>
                <span className="dhc-nav-pill">DEMO</span>
                <a
                  href="https://portal.digitalhome.cloud/signin"
                  className="dhc-nav-link"
                >
                  {t("nav.signin")}
                </a>
              </>
            )}

            {isAuthenticated && (
              <>
                <span className="dhc-nav-pill dhc-nav-pill--ok">
                  {user?.idTokenPayload?.name ||
                    user?.idTokenPayload?.email ||
                    user?.username ||
                    "Signed in"}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="dhc-nav-link dhc-nav-link-button"
                >
                  Sign out
                </button>
              </>
            )}

            {/* Language switcher */}
            <div className="dhc-lang-switch">
              {languages.map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => changeLanguage(lng)}
                  className={
                    language === lng
                      ? "dhc-lang-btn dhc-lang-btn--active"
                      : "dhc-lang-btn"
                  }
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
