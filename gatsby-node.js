const path = require("path");

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      alias: {
        "@dhc/shared": path.resolve(__dirname, "../shared"),
      },
    },
  });
};
