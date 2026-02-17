/* eslint-disable */
// Environment-driven aws-exports for deployment.
// Generated from src/aws-exports.js by scripts/generate-aws-config-from-master.js

const getScopes = () => {
  const raw = process.env.GATSBY_COGNITO_OAUTH_SCOPES;
  if (!raw) return [
  "phone",
  "email",
  "openid",
  "profile",
  "aws.cognito.signin.user.admin"
];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

const getSocialProviders = () => {
  const raw = process.env.GATSBY_COGNITO_SOCIAL_PROVIDERS;
  if (!raw) return [
  "GOOGLE"
];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

const awsmobile = {
  aws_project_region: process.env.GATSBY_AWS_REGION,
  aws_cognito_identity_pool_id: process.env.GATSBY_IDENTITY_POOL_ID,
  aws_cognito_region: process.env.GATSBY_AWS_REGION,
  aws_user_pools_id: process.env.GATSBY_USER_POOL_ID,
  aws_user_pools_web_client_id: process.env.GATSBY_USER_POOL_CLIENT_ID,
  oauth: {
    domain: process.env.GATSBY_COGNITO_OAUTH_DOMAIN,
    scope: getScopes(),
    redirectSignIn: process.env.GATSBY_COGNITO_OAUTH_REDIRECT_SIGNIN,
    redirectSignOut: process.env.GATSBY_COGNITO_OAUTH_REDIRECT_SIGNOUT,
    responseType: process.env.GATSBY_COGNITO_OAUTH_RESPONSETYPE || "code",
  },
  federationTarget: "COGNITO_USER_POOLS",
  aws_cognito_username_attributes: ["EMAIL"],
  aws_cognito_mfa_configuration: "OFF",
  aws_cognito_mfa_types: ["SMS"],
  aws_cognito_password_protection_settings: {"passwordPolicyMinLength":8,"passwordPolicyCharacters":[]},
  aws_cognito_signup_attributes: ["EMAIL","NAME"],
  aws_cognito_social_providers: getSocialProviders(),
  aws_appsync_graphqlEndpoint: process.env.GATSBY_APPSYNC_ENDPOINT,
  aws_appsync_region: process.env.GATSBY_AWS_REGION,
  aws_appsync_authenticationType: process.env.GATSBY_APPSYNC_AUTH_TYPE || "AMAZON_COGNITO_USER_POOLS",
  aws_user_files_s3_bucket: "digitalhome-cloudec099-main",
  aws_user_files_s3_bucket_region: "eu-central-1",
};

export default awsmobile;