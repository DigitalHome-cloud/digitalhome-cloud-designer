module.exports = {
  siteMetadata: {
    title: `DHC Modeler`,
    siteUrl: `https://modeler.digitalhome.cloud`,
    description: `Your launchpad for designing, managing and operating smart homes.`,
    author: `D-LAB-5`
  },
  plugins: [
    // Keep your existing Gatsby plugins here (image, sharp, etc.) when merging.

    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `locales`,
        path: `${__dirname}/src/locales`,
      },
    },
    {
      resolve: `gatsby-plugin-react-i18next`,
      options: {
        localeJsonSourceName: `locales`,
        languages: [`en`],
        defaultLanguage: `en`,
        siteUrl: `https://modeler.digitalhome.cloud`,
        i18nextOptions: {
          fallbackLng: `en`,
          interpolation: {
            escapeValue: false,
          },
        },
      },
    },
  ],
};
