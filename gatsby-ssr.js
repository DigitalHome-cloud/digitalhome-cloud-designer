import React from "react";
import { Amplify } from "aws-amplify";
import awsExports from "./src/aws-exports.deployment";
import { AuthProvider } from "./src/context/AuthContext";
import { SmartHomeProvider } from "./src/context/SmartHomeContext";

Amplify.configure(awsExports);

export const wrapRootElement = ({ element }) => (
  <AuthProvider>
    <SmartHomeProvider>{element}</SmartHomeProvider>
  </AuthProvider>
);

export const onRenderBody = ({ setHtmlAttributes, setHeadComponents }) => {
  setHtmlAttributes({ lang: "en" });
  setHeadComponents([
    <link
      key="favicon-svg"
      rel="icon"
      type="image/svg+xml"
      href="/favicon.svg"
    />,
  ]);
};
