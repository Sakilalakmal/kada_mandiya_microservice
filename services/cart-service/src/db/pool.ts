import sql from "mssql";

const config: sql.config = {
  user: process.env.DB_USER ?? "sa",
  password: process.env.DB_PASSWORD ?? "YourStrong!Passw0rd",
  server: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 1433),
  database: process.env.DB_NAME ?? "KadaMandiyaCart",
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config).then((pool) => {
      console.log(`cart-service DB connected ${config.server}:${config.port}/${config.database}`);
      return pool;
    });
  }
  return poolPromise;
}

export { sql };
