module.exports = {
  apps: [
    {
      name: "njinconvo-backend",
      cwd: "/var/www/njinconvo-backend/build",
      script: "./server.js",
      env: {
        PORT: 3333,
        HOST: "0.0.0.0",
        NODE_ENV: "development",
        APP_KEY: "xuScoDdC9Qdpb4i6DsZHr5uVatHjwkL0",
        DRIVE_DISK: "local",
        DB_CONNECTION: "pg",
        PG_HOST: "localhost",
        PG_PORT: "5432",
        PG_USER: "njinconvo",
        PG_PASSWORD: "",
        PG_DB_NAME: "njinconvo",
      },
    },
  ],
};
