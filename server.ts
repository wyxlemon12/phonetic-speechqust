import "dotenv/config";
import handler from "./api/index.ts";

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isDirectRun || (!process.env.VERCEL && process.env.NODE_ENV !== 'test')) {
  const port = Number(process.env.PORT) || 3000;
  const reqListener = async (req: any, res: any) => handler(req, res);

  const { createServer } = await import("http");
  createServer(reqListener).listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
