import sql from "mssql";

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT ?? 1433),
  database: process.env.DB_NAME!,
  options: {
    encrypt: false, // local docker
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = sql
      .connect(config)
      .then((pool) => {
        console.log(
          `✅ Database connected successfully → ${config.server}:${config.port}/${config.database}`
        );
        return pool;
      })
      .catch((err) => {
        console.error("❌ Database connection failed", err);
        process.exit(1); // fail fast (important)
      });
  }

  return poolPromise;
}

export { sql };
