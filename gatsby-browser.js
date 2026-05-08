import "./src/styles/dhc-tokens.css";
import "./src/styles/global.css";
import React from "react";
import { Amplify } from "aws-amplify";
import outputs from "./src/amplify_outputs.json";
import { AuthProvider } from "./src/context/AuthContext";
import { SmartHomeProvider } from "./src/context/SmartHomeContext";

Amplify.configure(outputs);

export const wrapRootElement = ({ element }) => (
  <AuthProvider>
    <SmartHomeProvider>{element}</SmartHomeProvider>
  </AuthProvider>
);
