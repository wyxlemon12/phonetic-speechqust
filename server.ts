import "dotenv/config";
import { createApp } from "./api/app.ts";

// Only start the server if this file is run directly
const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isDirectRun || (!process.env.VERCEL && process.env.NODE_ENV !== 'test')) {
  createApp().then(app => {
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  }).catch(err => {
    console.error("Failed to start server:", err);
  });
}

export { createApp };
