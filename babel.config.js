module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          esmodules: false
        },
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: true,
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    'external-helpers',
    [
      '@babel/plugin-transform',
      {
        corejs: true,
        modules: false,
      }
    ]
  ]
};
