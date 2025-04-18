
const path = require('path')
var { config } = { confgi: {} };

config = {

  domain: 'workspace.example.domain.com',

  workspace: {
    workspace: {
      //  baseUrl: "/workspace",
      name: "workspace",
      port: 5000
    },
    projects: [
      {
        baseUrl: "/angular-client",
        name: "angular-client",
        $db: false,
        port: 9000
      },
      {
        baseUrl: "/ionic-client",
        name: "ionic-client",
        $db: false,
        port: 9001
      },
      {
        baseUrl: "/isomorphic-lib",
        name: "isomorphic-lib",
        $db: {
          database: "tmp/db.sqlite3",
          type: "sqlite",
          synchronize: true,
          dropSchema: true,
          logging: false
        },
        port: 9002
      }
    ]
  }


}
module.exports = exports = { config };
