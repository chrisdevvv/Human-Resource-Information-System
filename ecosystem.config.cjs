module.exports = {
  apps: [
    {
      name: "hris-frontend",
      cwd: "C:/inetpub/chris2/Human-Resource-Information-System",
      script: "node",
      args: "./node_modules/next/dist/bin/next start -p 3001",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "hris-backend",
      cwd: "C:/inetpub/chris2/Human-Resource-Information-System/human-resource-management-system-backend",
      script: "node",
      args: "src/app.js",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};