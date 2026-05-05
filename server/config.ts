export const config = {
  port: Number(process.env.AUTH_SERVER_PORT ?? "3001"),
  authCookieName: "typing_auth",
  databasePath: process.env.AUTH_DB_PATH ?? "./data/auth.sqlite",
};
