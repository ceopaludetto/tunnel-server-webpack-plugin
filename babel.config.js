module.exports = (api) => {
  api.cache(true);

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          modules: false,
          corejs: 3,
          useBuiltIns: "entry",
          targets: {
            node: "8",
          },
        },
      ],
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      [
        "@babel/plugin-transform-runtime",
        {
          corejs: false,
          regenerator: true,
          helpers: true,
        },
      ],
    ],
  };
};
