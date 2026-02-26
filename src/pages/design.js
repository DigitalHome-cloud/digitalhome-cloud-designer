import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import WorkspaceShell from "../components/WorkspaceShell";
import ValidationPanel from "../components/ValidationPanel";
import EditLockToolbar from "../components/EditLockToolbar";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { getWorkspace } from "../blockly/workspace";
import { validateWorkspace } from "../validation/nfc15100";
import { useDesignLock } from "../hooks/useDesignLock";

const DesignPage = () => {
  const { t } = useTranslation();
  const [violations, setViolations] = React.useState([]);
  const debounceRef = React.useRef(null);

  const lock = useDesignLock();
  const isReadOnly = lock.mode !== "edit";

  // Set up workspace change listener for validation
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const checkValidation = () => {
      const ws = getWorkspace();
      if (!ws) return;
      const results = validateWorkspace(ws);
      setViolations(results);
    };

    const interval = setInterval(() => {
      const ws = getWorkspace();
      if (ws) {
        clearInterval(interval);
        ws.addChangeListener(() => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(checkValidation, 500);
        });
        checkValidation();
      }
    }, 500);

    return () => {
      clearInterval(interval);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const lockToolbar = (
    <EditLockToolbar
      mode={lock.mode}
      lockedBy={lock.lockedBy}
      isLockStale={lock.isLockStale}
      canEdit={lock.canEdit}
      error={lock.error}
      onEditDesign={lock.lockDesign}
      onSaveRelease={() => lock.saveDesign(false)}
      onSaveKeep={() => lock.saveDesign(true)}
      onCancel={lock.cancelEdit}
      onForceUnlock={lock.forceUnlock}
    />
  );

  return (
    <Layout>
      <main className="dhc-main">
        <section className="dhc-hero">
          <h1 className="dhc-hero-title">{t("design.title")}</h1>
          <p className="dhc-hero-subtitle">{t("design.subtitle")}</p>
        </section>
        <WorkspaceShell
          readOnly={isReadOnly}
          extraActions={lockToolbar}
        >
          <ValidationPanel violations={violations} />
        </WorkspaceShell>
      </main>
    </Layout>
  );
};

export default DesignPage;

export const query = graphql`
  query DesignPageQuery($language: String!) {
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
