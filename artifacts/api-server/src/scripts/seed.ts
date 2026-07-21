/**
 * Development seed script — populates initial data:
 *   1. Presentation sections (upsert, safe to re-run)
 *   2. Owner accounts for the two team leads (skips if already exist)
 *
 * Usage: pnpm --filter @workspace/api-server run seed
 *
 * Owner credentials are printed to the console — change passwords after first login.
 */
import { connectDb } from "../lib/db";
import PresentationSection from "../models/presentationSection";
import User from "../models/user";
import { logger } from "../lib/logger";
import bcrypt from "bcryptjs";

// ─── Presentation sections ────────────────────────────────────────────────────

const sections = [
  { slug: "introduction",          titleAr: "مقدمة — ما هي ثناره؟",    titleEn: "Introduction — What is Thanarah?",  order: 1 },
  { slug: "problem",               titleAr: "المشكلة",                  titleEn: "The Problem",                       order: 2 },
  { slug: "solution",              titleAr: "الحل",                     titleEn: "The Solution",                      order: 3 },
  { slug: "ecosystem",             titleAr: "منظومة ثناره",             titleEn: "Thanarah Ecosystem",                order: 4 },
  { slug: "customer-journey",      titleAr: "رحلة العميل",              titleEn: "Customer Journey",                  order: 5 },
  { slug: "plans",                 titleAr: "الباقات",                  titleEn: "Plans & Pricing",                   order: 6 },
  { slug: "smart-clinic",          titleAr: "العيادة الذكية",           titleEn: "Smart Clinic",                      order: 7 },
  { slug: "website-builder",       titleAr: "منشئ المواقع",             titleEn: "Website Builder",                   order: 8 },
  { slug: "whatsapp-ai",           titleAr: "واتساب AI",                titleEn: "WhatsApp AI",                       order: 9 },
  { slug: "apps",                  titleAr: "التطبيقات",                titleEn: "Mobile Applications",               order: 10 },
  { slug: "internal-operations",   titleAr: "نظام موظفي ثناره",         titleEn: "Internal Operations",               order: 11 },
  { slug: "architecture",          titleAr: "البنية التقنية",           titleEn: "Technical Architecture",            order: 12 },
  { slug: "security",              titleAr: "الأمان والحماية",          titleEn: "Security",                          order: 13 },
  { slug: "business-model",        titleAr: "نموذج الأعمال",            titleEn: "Business Model",                    order: 14 },
  { slug: "market",                titleAr: "السوق والتوسع",            titleEn: "Market & Expansion",                order: 15 },
  { slug: "competitive-advantages",titleAr: "المميزات التنافسية",       titleEn: "Competitive Advantages",            order: 16 },
  { slug: "roadmap",               titleAr: "خارطة الطريق",             titleEn: "Roadmap",                           order: 17 },
  { slug: "timeline",              titleAr: "الخطة الزمنية",            titleEn: "Timeline",                          order: 18 },
  { slug: "team",                  titleAr: "الفريق",                   titleEn: "The Team",                          order: 19 },
  { slug: "investment",            titleAr: "الاستثمار",                titleEn: "Investment",                        order: 20, requiredPermission: "presentation.view_financials" },
  { slug: "risks",                 titleAr: "المخاطر",                  titleEn: "Risks & Mitigation",                order: 21 },
  { slug: "summary",               titleAr: "الخلاصة",                  titleEn: "Summary",                           order: 22 },
];

// ─── Owner accounts ───────────────────────────────────────────────────────────

interface AccountDef {
  fullName: string;
  email: string;
  defaultPassword: string;
  role: "owner" | "investor" | "viewer";
}

const owners: AccountDef[] = [
  {
    fullName: "يوسف — Owner",
    email: process.env.THANARAH_OWNER_EMAIL_1 || "youssefd.business@gmail.com",
    defaultPassword: "Thanarah@2026!",
    role: "owner",
  },
  {
    fullName: "فيصل — Owner",
    email: process.env.THANARAH_OWNER_EMAIL_2 || "faisal.m.alenzai@gmail.com",
    defaultPassword: "Thanarah@2026!",
    role: "owner",
  },
];

// ─── Demo / guest account ─────────────────────────────────────────────────────
// A pre-seeded investor account for demos — no invitation needed.
// Credentials: demo@thanarah.com / Demo@Thanarah2026!
// Override email via THANARAH_DEMO_EMAIL env var.

const demoAccount: AccountDef = {
  fullName: "زائر تجريبي — Demo",
  email: process.env.THANARAH_DEMO_EMAIL || "demo@thanarah.com",
  defaultPassword: "Demo@Thanarah2026!",
  role: "investor",
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await connectDb();

  // 1. Sections
  logger.info("Seeding presentation sections…");
  for (const section of sections) {
    await PresentationSection.findOneAndUpdate(
      { slug: section.slug },
      { ...section, status: "published", content: { blocks: [] }, audience: ["all"] },
      { upsert: true, new: true },
    );
  }
  logger.info(`✓ Seeded ${sections.length} presentation sections`);

  // 2. Owner accounts (skip if email already registered)
  logger.info("Seeding owner accounts…");
  const created: string[] = [];
  const skipped: string[] = [];

  for (const owner of owners) {
    const existing = await User.findOne({ email: owner.email.toLowerCase() }).lean();
    if (existing) {
      skipped.push(owner.email);
      continue;
    }
    const passwordHash = await bcrypt.hash(owner.defaultPassword, 12);
    await User.create({
      fullName: owner.fullName,
      email: owner.email.toLowerCase(),
      passwordHash,
      role: owner.role,
      status: "active",
      emailVerified: true,
      permissions: [],
      allowedSections: [],
      preferredLanguage: "ar",
    });
    created.push(owner.email);
  }

  if (created.length) {
    logger.info("─────────────────────────────────────────────────────");
    logger.info("✓ Owner accounts created — CHANGE PASSWORDS AFTER FIRST LOGIN");
    logger.info(`  Accounts : ${created.join(" | ")}`);
    logger.info(`  Password : Thanarah@2026!`);
    logger.info("─────────────────────────────────────────────────────");
  }
  if (skipped.length) {
    logger.info(`  Skipped (already exist): ${skipped.join(", ")}`);
  }

  // 3. Demo / guest account
  logger.info("Seeding demo account…");
  const demoExisting = await User.findOne({ email: demoAccount.email.toLowerCase() }).lean();
  if (demoExisting) {
    logger.info(`  Skipped demo (already exists): ${demoAccount.email}`);
  } else {
    const passwordHash = await bcrypt.hash(demoAccount.defaultPassword, 12);
    await User.create({
      fullName: demoAccount.fullName,
      email: demoAccount.email.toLowerCase(),
      passwordHash,
      role: demoAccount.role,
      status: "active",
      emailVerified: true,
      permissions: [],
      allowedSections: [],
      preferredLanguage: "ar",
    });
    logger.info("─────────────────────────────────────────────────────");
    logger.info("✓ Demo account created");
    logger.info(`  Email    : ${demoAccount.email}`);
    logger.info(`  Password : ${demoAccount.defaultPassword}`);
    logger.info(`  Role     : ${demoAccount.role}`);
    logger.info("─────────────────────────────────────────────────────");
  }

  logger.info("Seed complete ✓");
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
