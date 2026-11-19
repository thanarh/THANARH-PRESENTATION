import WhatsAppAccount from "../models/whatsappAccount";
import { connectDb } from "./db";
import { normalizePhoneDigits } from "./phone";

/**
 * Admin login allowlist: enabled WhatsApp admin entries configured by the owner,
 * with WA_ADMIN_PHONES as a Replit Secrets fallback. Phone values are never logged.
 */
export async function getConfiguredPhoneAdmin(
  phone: string,
): Promise<{ name: string } | null> {
  const digits = normalizePhoneDigits(phone);
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;

  try {
    await connectDb();
    const accounts = await WhatsAppAccount.find({ enabled: true })
      .select("adminUsers")
      .lean();

    for (const account of accounts) {
      const match = (account.adminUsers ?? []).find(
        (admin) => admin.enabled !== false && normalizePhoneDigits(admin.phone) === digits,
      );
      if (match) return { name: match.name };
    }
  } catch {
    // Fail closed unless the explicitly configured secret fallback matches.
  }

  const envPhones = (process.env.WA_ADMIN_PHONES ?? "")
    .split(",")
    .map((value) => normalizePhoneDigits(value))
    .filter(Boolean);
  return envPhones.includes(digits) ? { name: "مسؤول ثناره" } : null;
}
