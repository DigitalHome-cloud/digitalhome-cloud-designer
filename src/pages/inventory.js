import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import DeviceCatalogue from "../components/DeviceCatalogue";
import DeviceInventoryManager from "../components/DeviceInventoryManager";
import DeviceInbox from "../components/DeviceInbox";
import { useTranslation } from "gatsby-plugin-react-i18next";

const InventoryPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState("inventory");

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("inventory.title")}</h1>
          <p className="dhc-hero-subtitle">{t("inventory.subtitle")}</p>
        </section>

        <div
          className="dhc-nav-group"
          style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
        >
          <button
            type="button"
            className={
              tab === "inventory" ? "dhc-button-primary" : "dhc-button-ghost"
            }
            onClick={() => setTab("inventory")}
          >
            {t("inventory.tab.inventory")}
          </button>
          <button
            type="button"
            className={
              tab === "catalogue" ? "dhc-button-primary" : "dhc-button-ghost"
            }
            onClick={() => setTab("catalogue")}
          >
            {t("inventory.tab.catalogue")}
          </button>
          <button
            type="button"
            className={
              tab === "inbox" ? "dhc-button-primary" : "dhc-button-ghost"
            }
            onClick={() => setTab("inbox")}
          >
            {t("inventory.tab.inbox")}
          </button>
        </div>

        {tab === "inventory" && <DeviceInventoryManager />}
        {tab === "catalogue" && <DeviceCatalogue />}
        {tab === "inbox" && <DeviceInbox />}
      </main>
    </Layout>
  );
};

export default InventoryPage;

export const query = graphql`
  query InventoryPageQuery($language: String!) {
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
