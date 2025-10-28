const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;
const customizeWebpackConfig = (config, options) => {
  const singleSpaWebpackConfig = singleSpaAngularWebpack(config, options);
  // Feel free to modify this webpack config however you'd like to
  return singleSpaWebpackConfig;
}
module.exports = customizeWebpackConfig;
