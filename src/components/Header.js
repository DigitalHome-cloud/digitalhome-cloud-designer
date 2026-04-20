import * as React from "react";
import { Link } from "gatsby";
import { useTranslation, useI18next } from "gatsby-plugin-react-i18next";
import { useAuth } from "../context/AuthContext";
import { useSmartHome } from "../context/SmartHomeContext";
import { getAppUrl } from "../utils/getAppUrl";

const Header = () => {
  const { t } = useTranslation();
  const { languages, language, changeLanguage } = useI18next();
  const { authState, isAuthenticated, user, signOut } = useAuth();
  const { activeHome } = useSmartHome();

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
            <Link to="/manager/" className="dhc-nav-link">
              {t("nav.manager")}
            </Link>
            <Link to="/design/" className="dhc-nav-link">
              {t("nav.design")}
            </Link>
            <Link to="/viewer/" className="dhc-nav-link">
              {t("nav.viewer")}
            </Link>
            <Link to="/drawing/" className="dhc-nav-link">
              {t("nav.drawing")}
            </Link>
            <Link to="/bom/" className="dhc-nav-link">
              {t("nav.bom")}
            </Link>
            <Link to="/debug/" className="dhc-nav-link">
              {t("nav.debug")}
            </Link>
            <a
              href={`${getAppUrl("portal")}?home=${encodeURIComponent(activeHome.id)}`}
              className="dhc-nav-link"
            >
              {t("nav.portal")}
            </a>
          </div>

          <div className="dhc-nav-group dhc-nav-auth">
            <span className="dhc-nav-pill" title={t("smarthome.label")}>
              {activeHome.id}
            </span>
            {authState === "demo" && (
              <>
                <span className="dhc-nav-pill">{t("role.guest")}</span>
                <Link to="/signin/" className="dhc-nav-link">
                  {t("nav.signin")}
                </Link>
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
