import * as React from "react";
import { Link } from "gatsby";
import { useTranslation } from "gatsby-plugin-react-i18next";

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="dhc-header">
      <div className="dhc-header-inner">
        <div className="dhc-logo">
          <span className="dhc-logo-mark">DH</span>
          <div className="dhc-logo-text">
            <span className="dhc-logo-title">DigitalHome.Cloud</span>
            <span className="dhc-logo-subtitle">Modeler</span>
          </div>
        </div>

        <nav className="dhc-nav">
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
            href="https://designer.digitalhome.cloud"
            className="dhc-nav-link"
            target="_blank"
            rel="noreferrer"
          >
            {t("nav.designer")}
          </a>
          <a
            href="https://github.com/DigitalHome-cloud"
            className="dhc-nav-link"
            target="_blank"
            rel="noreferrer"
          >
            {t("nav.github")}
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
