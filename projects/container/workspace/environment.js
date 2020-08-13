
let { config } = { config: {} };

config = {

  workspace: {
    workspace: {
      baseUrl: '/info',
      name: 'workspace',
      port: 5000
    },
    projects: [
      {
        baseUrl: '/components',
        name: 'angular-lib',
        port: 4201
      },
      {
        baseUrl: '/api',
        name: 'isomorphic-lib',
        port: 4000,
        $db: {
          name: 'default',
          database: 'tmp/db.sqlite3',
          type: 'sqlite',
          synchronize: true,
          dropSchema: true,
          logging: false
        }
      },
      {
        baseUrl: '/test',
        name: 'angular-client',
        port: 4200
      }
    ]
  }

}

module.exports = exports = { config };


