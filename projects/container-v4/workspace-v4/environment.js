const path = require('path')
var { config } = { config: {} }

config = {

  // domain: 'workspace-v2.example.domain.com',

  workspace: {
    workspace: {
      //  baseUrl: "/workspace-v3",
      name: "workspace-v3",
      port: 5000
    },
    projects: [
      // {
      //   "baseUrl": "/angular-lib-v3",
      //   "name": "angular-lib-v3",
      //   "port": 6001
      // },
      // {
      //   "baseUrl": "/isomorphic-lib-v3",
      //   "name": "isomorphic-lib-v3",
      //   "port": 6002
      // },
      // {
      //   "baseUrl": "/docker-v3",
      //   "name": "docker-v3",
      //   "port": 6003
      // },
      // {
      //   "baseUrl": "/api-isomorphic-lib-v3",
      //   "name": "isomorphic-lib-v3",
      //   "$db": {
      //     "database": "tmp/db-for-isomorphic-lib-v3.sqlite3",
      //     "type": "sqlite",
      //     "synchronize": true,
      //     "dropSchema": true,
      //     "logging": false
      //   },
      //   "port": 6002
      // }

    ]
  }


}
module.exports = exports = { config };
