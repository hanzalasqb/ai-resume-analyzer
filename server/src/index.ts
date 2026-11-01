import { createApp } from "./app.js";
import { config } from "./config.js";
import { OpenAICompatibleClient } from "./llm.js";

const app = createApp(new OpenAICompatibleClient(config), {
  corsOrigin: config.CORS_ORIGIN,
  maxUploadMb: config.MAX_UPLOAD_MB,
});

app.listen(config.PORT, () => console.log(`🚀 API listening on http://localhost:${config.PORT}`));
