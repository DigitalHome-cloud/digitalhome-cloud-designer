import * as React from "react";
import Header from "./Header";
import { useTranslation } from "gatsby-plugin-react-i18next";

const Layout = ({ children }) => {
  const { t } = useTranslation();

  return (
    <div className="dhc-root">
      <Header />
      <div className="dhc-content">{children}</div>
      <footer className="dhc-footer">
        <div className="dhc-footer-inner">
          <span>© {new Date().getFullYear()} D-LAB-5</span>
          <span className="dhc-footer-secondary">
            {t("footer.tagline")}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
