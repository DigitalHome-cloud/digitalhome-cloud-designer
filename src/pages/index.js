import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import WorkspaceShell from "../components/WorkspaceShell";
import { useTranslation } from "gatsby-plugin-react-i18next";

const IndexPage = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("app.title")}</h1>
          <p className="dhc-hero-subtitle">{t("app.subtitle")}</p>
        </section>

        <WorkspaceShell />
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
