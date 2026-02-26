import React from "react";
import { useTranslation } from "gatsby-plugin-react-i18next";

const EditLockToolbar = ({
  mode,
  lockedBy,
  isLockStale,
  canEdit,
  error,
  onEditDesign,
  onSaveRelease,
  onSaveKeep,
  onCancel,
  onForceUnlock,
}) => {
  const { t } = useTranslation();

  return (
    <div className="dhc-lock-toolbar">
      {mode === "loading" && (
        <span className="dhc-lock-status">Loading...</span>
      )}

      {mode === "saving" && (
        <span className="dhc-lock-status">Saving...</span>
      )}

      {mode === "view" && (
        <>
          <span className="dhc-lock-status">{t("lock.viewMode")}</span>
          {canEdit && (
            <button
              type="button"
              className="dhc-button-primary"
              onClick={onEditDesign}
            >
              {t("lock.editDesign")}
            </button>
          )}
        </>
      )}

      {mode === "edit" && (
        <>
          <button
            type="button"
            className="dhc-button-primary"
            onClick={onSaveRelease}
          >
            {t("lock.saveRelease")}
          </button>
          <button
            type="button"
            className="dhc-button-secondary"
            onClick={onSaveKeep}
          >
            {t("lock.saveKeep")}
          </button>
          <button
            type="button"
            className="dhc-button-ghost"
            onClick={onCancel}
          >
            {t("lock.cancel")}
          </button>
        </>
      )}

      {mode === "locked" && (
        <>
          <span className="dhc-lock-status dhc-lock-status--locked">
            {t("lock.lockedBy", { user: lockedBy })}
          </span>
          {isLockStale && canEdit && (
            <button
              type="button"
              className="dhc-button-danger"
              onClick={onForceUnlock}
            >
              {t("lock.forceUnlock")}
            </button>
          )}
        </>
      )}

      {error && (
        <span style={{ fontSize: "0.8rem", color: "#fca5a5" }}>{error}</span>
      )}
    </div>
  );
};

export default EditLockToolbar;
