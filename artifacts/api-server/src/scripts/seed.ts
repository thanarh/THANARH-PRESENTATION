/**
 * Development seed script — run only once to populate initial presentation sections.
 * Usage: pnpm --filter @workspace/api-server run seed
 */
import { connectDb } from "../lib/db";
import PresentationSection from "../models/presentationSection";
import { logger } from "../lib/logger";

const sections = [
  { slug: "introduction", titleAr: "مقدمة — ما هي ثناره؟", titleEn: "Introduction — What is Thanarah?", order: 1 },
  { slug: "problem", titleAr: "المشكلة", titleEn: "The Problem", order: 2 },
  { slug: "solution", titleAr: "الحل", titleEn: "The Solution", order: 3 },
  { slug: "ecosystem", titleAr: "منظومة ثناره", titleEn: "Thanarah Ecosystem", order: 4 },
  { slug: "customer-journey", titleAr: "رحلة العميل", titleEn: "Customer Journey", order: 5 },
  { slug: "plans", titleAr: "الباقات", titleEn: "Plans & Pricing", order: 6 },
  { slug: "smart-clinic", titleAr: "العيادة الذكية", titleEn: "Smart Clinic", order: 7 },
  { slug: "website-builder", titleAr: "منشئ المواقع", titleEn: "Website Builder", order: 8 },
  { slug: "whatsapp-ai", titleAr: "واتساب AI", titleEn: "WhatsApp AI", order: 9 },
  { slug: "apps", titleAr: "التطبيقات", titleEn: "Mobile Applications", order: 10 },
  { slug: "internal-operations", titleAr: "نظام موظفي ثناره", titleEn: "Internal Operations", order: 11 },
  { slug: "architecture", titleAr: "البنية التقنية", titleEn: "Technical Architecture", order: 12 },
  { slug: "security", titleAr: "الأمان والحماية", titleEn: "Security", order: 13 },
  { slug: "business-model", titleAr: "نموذج الأعمال", titleEn: "Business Model", order: 14 },
  { slug: "market", titleAr: "السوق والتوسع", titleEn: "Market & Expansion", order: 15 },
  { slug: "competitive-advantages", titleAr: "المميزات التنافسية", titleEn: "Competitive Advantages", order: 16 },
  { slug: "roadmap", titleAr: "خارطة الطريق", titleEn: "Roadmap", order: 17 },
  { slug: "timeline", titleAr: "الخطة الزمنية", titleEn: "Timeline", order: 18 },
  { slug: "team", titleAr: "الفريق", titleEn: "The Team", order: 19 },
  { slug: "investment", titleAr: "الاستثمار", titleEn: "Investment", order: 20, requiredPermission: "presentation.view_financials" },
  { slug: "risks", titleAr: "المخاطر", titleEn: "Risks & Mitigation", order: 21 },
  { slug: "summary", titleAr: "الخلاصة", titleEn: "Summary", order: 22 },
];

async function seed() {
  await connectDb();
  logger.info("Seeding presentation sections...");

  for (const section of sections) {
    await PresentationSection.findOneAndUpdate(
      { slug: section.slug },
      {
        ...section,
        status: "published",
        content: { blocks: [] },
        audience: ["all"],
      },
      { upsert: true, new: true },
    );
  }

  logger.info(`Seeded ${sections.length} presentation sections`);
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
