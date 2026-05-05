import { createApp, config } from "./app";

async function startServer() {
  const app = await createApp();

  app.listen(config.port, () => {
    console.log(`Auth server listening on http://localhost:${config.port}`);
  });
}

void startServer();
