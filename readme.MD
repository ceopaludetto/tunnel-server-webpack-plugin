### Motivation

When compiling servers in the webpack, you are required to see the build logs and the server logs, this can get confusing, this plugin aims to separate the logs.


### How to use

If you use start-server-webpack-plugin, you have to replace with this plugin:

```javascript
const TunnelServerWebpackPlugin = require('tunnel-server-webpack-plugin');

module.exports = {
  // rest of configuration
  plugins: [
    new TunnelServerWebpackPlugin({
      name: 'index.js', // required
      clearOnRestart: true, // if true, will clear on every restart of server
      keyboord: true, // if true, sending rs in compilation terminal will restart the server
      port: 9838 // port of socket server
    })
  ]
}
```

Then, just open another term and run `tunnel-server-webpack-plugin`. You can pass `-p, --port` of socket server, default is 9838.