import React from "react";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { centerOnBlock } from "../blockly/workspace";

const ValidationPanel = ({ violations = [] }) => {
  const { t } = useTranslation();

  const handleClick = (blockId) => {
    if (blockId) {
      centerOnBlock(blockId);
    }
  };

  const severityIcon = (severity) => {
    if (severity === "error") return "!!";
    if (severity === "warning") return "!";
    return "i";
  };

  return (
    <div className="dhc-validation-panel">
      <div className="dhc-validation-title">
        {t("validation.title")} ({violations.length})
      </div>
      {violations.length === 0 ? (
        <p className="dhc-validation-empty">{t("validation.noIssues")}</p>
      ) : (
        <ul className="dhc-validation-list">
          {violations.map((v, i) => (
            <li
              key={`${v.ruleId}-${v.blockId}-${i}`}
              className={`dhc-validation-item dhc-validation-item--${v.severity}`}
              onClick={() => handleClick(v.blockId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleClick(v.blockId);
              }}
            >
              <span>{severityIcon(v.severity)}</span>
              <span>{v.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ValidationPanel;
