import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

// Resolve the portal's built static directory (works both locally and on Render)
// Repo layout: artifacts/api-server/dist/index.mjs → ../../.. → repo root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTAL_DIR = path.resolve(__dirname, "../../../artifacts/thanarah-portal/dist/public");

const app: Express = express();

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
    );
  }
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// CORS: strict in production (only the configured FRONTEND_URL), permissive in dev.
const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || false   // false = reject every cross-origin request when not configured
    : true;                               // reflect any origin in development

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ── Serve the React portal in production ──────────────────────────────────────
// In development the Vite dev-server handles the frontend on a separate port.
// On Render (production) there is only one process, so Express serves the
// pre-built static files and falls back to index.html for SPA routing.
if (process.env.NODE_ENV === "production" && fs.existsSync(PORTAL_DIR)) {
  logger.info({ PORTAL_DIR }, "Serving portal static files");

  // Long-lived cache for hashed asset bundles
  app.use(
    "/assets",
    express.static(path.join(PORTAL_DIR, "assets"), {
      maxAge: "1y",
      immutable: true,
    }),
  );

  // Everything else (logos, fonts, manifest …)
  app.use(express.static(PORTAL_DIR, { maxAge: "1h" }));

  // SPA catch-all — return index.html for any non-API, non-file path
  app.get("/{*path}", (_req: Request, res: Response) => {
    res.sendFile(path.join(PORTAL_DIR, "index.html"));
  });
} else if (process.env.NODE_ENV === "production") {
  logger.warn({ PORTAL_DIR }, "Portal static files not found — frontend will not be served");
}

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.url }, "Unhandled error");
  res.status(500).json({ error: "An internal error occurred" });
});

export default app;
