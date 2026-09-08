module.exports = {
  apps: [
    {
      name: "harmos-ai",
      script: "python",
      args: "-m uvicorn apps.gateway.main:app --host 127.0.0.1 --port 8002",
      cwd: __dirname,
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        HARMOS_PORT: "8002",
        PYTHONPATH: "."
      }
    }
  ]
};

