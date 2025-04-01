module.exports = function override(config) {
    // Remove the source-map-loader rule
    config.module.rules = config.module.rules.filter((rule) =>
      !(rule.use && rule.use.includes('source-map-loader'))
    );
  
    return config;
  };