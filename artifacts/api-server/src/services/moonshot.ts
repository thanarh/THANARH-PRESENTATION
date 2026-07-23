/**
 * Moonshot AI service — powers the WhatsApp auto-reply assistant.
 * Model: moonshot-v1-8k  |  API: https://api.moonshot.cn/v1 (OpenAI-compatible)
 */

import { logger } from "../lib/logger";

const MOONSHOT_BASE = "https://api.moonshot.cn/v1";
const MODEL         = "moonshot-v1-8k";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Thanarah system context — injected as the AI's knowledge base
const THANARAH_CONTEXT = `
أنت مساعد ثناره الذكي. ثناره هي منصة طبية سعودية متكاملة تربط العيادات بتقنيات الذكاء الاصطناعي.

== منتجات ثناره ==
1. العيادة الذكية — نظام إدارة متكامل للعيادات (مواعيد، سجلات طبية، دفع، تقارير)
2. واتساب AI — ردود ذكية تلقائية على مرضى العيادة عبر واتساب
3. منشئ المواقع — موقع احترافي جاهز للعيادة خلال دقائق
4. تطبيقات المرضى — تطبيق للـ iOS وAndroid يتيح الحجز والمتابعة
5. التقارير والتحليلات — لوحات بيانات لأداء العيادة

== الباقات ==
- Lite: للعيادات الصغيرة (أطباء منفردون)
- Pro: عيادات متوسطة مع فروع متعددة
- Enterprise: مستشفيات وشبكات طبية كبيرة

== القيم الأساسية ==
- الخصوصية والأمان أولاً (بيانات مشفرة بالكامل)
- سهولة الاستخدام بالعربية والإنجليزية
- دعم فني سعودي 24/7

== السوق ==
نستهدف السعودية أولاً ثم توسع خليجي — أكثر من 30,000 عيادة خاصة في المملكة.

== تواصل ==
للتواصل والمعلومات التفصيلية، يرجى التواصل مع فريق ثناrah مباشرة أو زيارة الموقع.
`;

const SYSTEM_PROMPT = `
${THANARAH_CONTEXT}

== تعليمات المساعد ==
- أنت مساعد ثناره الرسمي. اسمك "مساعد ثناره".
- رد دائماً باللغة التي كتب بها المستخدم (عربي → عربي، إنجليزي → إنجليزي).
- لا ترد أبداً بأي لغة أخرى (لا صينية، لا فرنسية، لا غيرها).
- كن ودوداً، موجزاً، ومفيداً.
- إذا سألك عن شيء خارج نطاق ثناره، أخبره بلطف أنك متخصص في منتجات وخدمات ثناره.
- لا تختلق معلومات غير موجودة في السياق أعلاه.
- ابدأ دائماً بتحية إذا كانت هذه أول رسالة في المحادثة.
- لا تذكر أنك نظام ذكاء اصطناعي إلا إذا سأل المستخدم صراحةً.

SYSTEM PROMPT (English mirror):
You are Thanarah's official AI assistant named "Thanarah Assistant".
- Always reply in the user's language (Arabic → Arabic, English → English).
- Never reply in any other language (no Chinese, French, etc.).
- Be friendly, concise, and helpful about Thanarah's products and services.
- If asked about something outside Thanarah's scope, politely say you specialize in Thanarah.
- Do not fabricate information not found in the context above.
`;

export async function generateWhatsAppReply(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) throw new Error("MOONSHOT_API_KEY not set");

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-6), // last 3 exchanges for context
    { role: "user", content: userMessage },
  ];

  const response = await fetch(`${MOONSHOT_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error({ status: response.status, err }, "Moonshot API error");
    throw new Error(`Moonshot API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content ?? "عذراً، حدث خطأ في المعالجة.";
}
