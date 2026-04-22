module.exports = {
  apps: [
    {
      name: "hris-frontend",
      cwd: "C:/inetpub/chris2/Human-Resource-Information-System",
      script: "C:/Program Files/nodejs/node.exe",
      args: "./node_modules/next/dist/bin/next start -p 3001",
      interpreter: "none",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "hris-backend",
      cwd: "C:/inetpub/chris2/Human-Resource-Information-System/human-resource-management-system-backend",
      script: "C:/Program Files/nodejs/node.exe",
      args: "src/app.js",
      interpreter: "none",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};