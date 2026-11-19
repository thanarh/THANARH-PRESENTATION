import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    "phone",
    "*.phone",
    "jid",
    "*.jid",
    "remoteJid",
    "*.remoteJid",
    "otp",
    "*.otp",
    "verificationCode",
    "*.verificationCode",
    "code",
    "*.code",
    "token",
    "*.token",
    "inviteUrl",
    "*.inviteUrl",
    "apiKey",
    "*.apiKey",
    "authorization",
    "*.authorization",
    "body",
    "*.body",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
