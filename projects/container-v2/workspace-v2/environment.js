const path = require('path')
var { config } = { config: {} }

config = {

  // domain: 'workspace-v2.example.domain.com',

  workspace: {
    workspace: {
      //  baseUrl: "/workspace-v2",
      name: "workspace-v2",
      port: 5000
    },
    projects: [
      {
        "baseUrl": "/angular-lib-v2",
        "name": "angular-lib-v2",
        "port": 6001
      },
      {
        "baseUrl": "/api-isomorphic-lib-v2",
        "name": "isomorphic-lib-v2",
        "$db": {
          "database": "tmp/db-for-isomorphic-lib-v2.sqlite3",
          "type": "sqlite",
          "synchronize": true,
          "dropSchema": true,
          "logging": false
        },
        "port": 6002
      }

    ]
  }


}
module.exports = exports = { config };
