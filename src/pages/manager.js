import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import SmartHomeManager from "../components/SmartHomeManager";
import { useTranslation } from "gatsby-plugin-react-i18next";

const ManagerPage = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("manager.title")}</h1>
          <p className="dhc-hero-subtitle">{t("manager.subtitle")}</p>
        </section>
        <SmartHomeManager />
      </main>
    </Layout>
  );
};

export default ManagerPage;

export const query = graphql`
  query ManagerPageQuery($language: String!) {
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
