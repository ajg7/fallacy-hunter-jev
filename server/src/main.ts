import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

// Load server/.env when present (TYPESAFE_API_KEY lives there). Real environment variables win.
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the environment.
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
