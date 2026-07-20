import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import compression from "compression";
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
  // CORP/COOP are only safe in production where we control origins;
  // in development the Vite proxy creates cross-origin requests that these would block.
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
    );
  }
  next();
});

// Rate limiting — global (generous) + strict on auth endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
  skipSuccessfulRequests: true,
});

app.use(globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// Gzip/Brotli compression for all responses — reduces bandwidth by ~70 %
app.use(compression({
  // Skip compression for small responses (< 1 KB) — overhead not worth it
  threshold: 1024,
  // Use highest compression for text (JSON, HTML, JS, CSS)
  level: 6,
}));

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

  // Long-lived cache for hashed asset bundles (JS/CSS with content hash)
  app.use(
    "/assets",
    express.static(path.join(PORTAL_DIR, "assets"), {
      maxAge: "1y",
      immutable: true,
      setHeaders(res, filePath) {
        // Allow pre-compressed brotli/gzip to be served with correct encoding
        if (filePath.endsWith(".br")) res.setHeader("Content-Encoding", "br");
        else if (filePath.endsWith(".gz")) res.setHeader("Content-Encoding", "gzip");
      },
    }),
  );

  // Videos — 7-day cache; browsers won't re-download unless changed
  app.use(
    express.static(PORTAL_DIR, {
      maxAge: "7d",
      setHeaders(res, filePath) {
        if (/\.(mov|webm|mp4|ogv)$/.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
          res.setHeader("Accept-Ranges", "bytes"); // enable range requests for video seeking
        } else if (/\.(png|jpg|jpeg|ico|svg|woff2?)$/.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=86400"); // 1-day for images
        }
      },
    }),
  );

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
