module.exports = {
  apps: [{
    name: 'XRPARROT',
    script: 'index.js',
    watch: false,
    instances: 1,
    exec_mode: 'cluster',
    ignore_watch: ["node_modules", "db", ".git"],
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      MONGO: "mongodb://127.0.0.1:20000/xrparrot" // Assume local docker with mongo @ 20000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGO: "mongodb://mongo:27017/xrparrot" // Production assumes docker-compose
    }
  }]
}
