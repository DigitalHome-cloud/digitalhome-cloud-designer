import * as React from "react";
import { graphql, Link } from "gatsby";
import Layout from "../components/Layout";
import HomeFlowBoard from "../components/HomeFlowBoard";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { useSmartHome } from "../context/SmartHomeContext";
import { useAuth } from "../context/AuthContext";

const IndexPage = () => {
  const { t } = useTranslation();
  const { activeHome } = useSmartHome();
  const { isAuthenticated, hasGroup } = useAuth();
  const devopsOnly = !!hasGroup("dhc-devops-engineers");

  if (isAuthenticated) {
    return (
      <Layout>
        <main className="dhc-main">
          <HomeFlowBoard
            activeHomeId={activeHome?.id || null}
            devopsOnly={devopsOnly}
          />
        </main>
      </Layout>
    );
  }

  // Unauthenticated landing — keep the existing module-card layout.
  const modules = [
    {
      key: "manager",
      title: t("dashboard.manager.title"),
      description: t("dashboard.manager.description"),
      path: "/manager/",
    },
    {
      key: "design",
      title: t("dashboard.design.title"),
      description: t("dashboard.design.description"),
      path: "/design/",
    },
    {
      key: "viewer",
      title: t("dashboard.viewer.title"),
      description: t("dashboard.viewer.description"),
      path: "/viewer/",
    },
  ];

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("app.title")}</h1>
          <p className="dhc-hero-subtitle">{t("app.subtitle")}</p>
        </section>

        <section>
          <h2 className="dhc-section-title">{t("dashboard.modulesTitle")}</h2>
          <div className="dhc-dashboard-grid">
            {modules.map((mod) => (
              <Link
                key={mod.key}
                to={mod.path}
                className="dhc-dashboard-card"
              >
                <h3 className="dhc-dashboard-card-title">{mod.title}</h3>
                <p className="dhc-dashboard-card-desc">{mod.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default IndexPage;

export const query = graphql`
  query IndexPageQuery($language: String!) {
    locales: allLocale(filter: { language: { eq: $language } }) {
      edges {
        node {
          ns
          data
          language
        }
      }
    }
  }
`;
