import * as React from "react";
import Layout from "../components/Layout";
import { Authenticator, ThemeProvider, defaultTheme } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useTranslation } from "gatsby-plugin-react-i18next";
import { graphql, navigate } from "gatsby";
import { useAuth } from "../context/AuthContext";

const dhcTheme = {
  name: "dhc-theme",
  overrides: [
    {
      colorMode: "light",
      tokens: {
        colors: {
          brand: {
            primary: {
              10: "#0f172a",
              80: "#1d4ed8",
              90: "#1e40af",
            },
          },
        },
        radii: {
          small: "0.5rem",
          medium: "1rem",
        },
      },
    },
  ],
};

const SyncAuth = ({ user }) => {
  const { reloadSession } = useAuth();

  React.useEffect(() => {
    if (user) {
      reloadSession();
    }
  }, [user, reloadSession]);

  return null;
};

const SignInPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated]);

  return (
    <Layout>
      <main className="dhc-auth-page">
        <h1>{t("nav.signin")}</h1>
        <div className="dhc-auth-widget">
          <ThemeProvider theme={{ ...defaultTheme, ...dhcTheme }}>
            <Authenticator>
              {({ signOut, user }) => (
                <div>
                  <SyncAuth user={user} />
                  <p>
                    {user
                      ? `Signed in as ${user.signInDetails?.loginId || user.username}`
                      : "Complete the form to sign in."}
                  </p>
                  {user && (
                    <button
                      type="button"
                      onClick={signOut}
                      className="dhc-nav-link dhc-nav-link-button"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              )}
            </Authenticator>
          </ThemeProvider>
        </div>
      </main>
    </Layout>
  );
};

export default SignInPage;

export const query = graphql`
  query SignInPageQuery($language: String!) {
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
