export interface RuntimeConfig {
  environment: "development" | "test" | "production";
  port: number;
  publicOrigin: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadConfig(): RuntimeConfig {
  const environment = (process.env.NODE_ENV ?? "development") as RuntimeConfig["environment"];
  if (!["development", "test", "production"].includes(environment)) throw new Error("Invalid NODE_ENV");
  const publicOrigin = required("PUBLIC_ORIGIN");
  const supabaseUrl = required("SUPABASE_URL");
  const supabaseAnonKey = required("SUPABASE_ANON_KEY");
  const parsedOrigin = new URL(publicOrigin);
  const parsedSupabase = new URL(supabaseUrl);
  if (environment === "production" && (parsedOrigin.protocol !== "https:" || parsedSupabase.protocol !== "https:")) {
    throw new Error("Production origins and Supabase URL must use HTTPS");
  }
  const port = Number(process.env.PORT ?? "8080");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port");
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return {
    environment, port, publicOrigin: parsedOrigin.origin, supabaseUrl: parsedSupabase.origin,
    supabaseAnonKey, ...(serviceRole ? { supabaseServiceRoleKey: serviceRole } : {}),
  };
}
