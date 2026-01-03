import sql from "mssql";

function envOr(key: string, fallback: string) {
  const raw = process.env[key];
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.length ? value : fallback;
}

const config: sql.config = {
  user: envOr("DB_USER", "sa"),
  password: envOr("DB_PASSWORD", "YourStrong!Passw0rd"),
  server: envOr("DB_HOST", "localhost"),
  port: Number(process.env.DB_PORT ?? 1433),
  database: envOr("DB_NAME", "KadaMandiyaOrder"),
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
      console.log(`order-service DB connected ${config.server}:${config.port}/${config.database}`);
      return pool;
    });
  }
  return poolPromise;
}

export { sql };

