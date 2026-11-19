import WhatsAppAccount from "../models/whatsappAccount";
import { connectDb } from "./db";
import { normalizePhoneDigits, normalizePhoneE164 } from "./phone";

export interface ConfiguredPhoneAdmin {
  name: string;
  phone: string;
}

export async function listConfiguredPhoneAdmins(): Promise<ConfiguredPhoneAdmin[]> {
  const admins = new Map<string, ConfiguredPhoneAdmin>();

  try {
    await connectDb();
    const accounts = await WhatsAppAccount.find({ enabled: true })
      .select("adminUsers")
      .lean();

    for (const account of accounts) {
      for (const admin of account.adminUsers ?? []) {
        if (admin.enabled === false) continue;
        const phone = normalizePhoneE164(admin.phone);
        if (!phone) continue;
        admins.set(phone, { name: admin.name || "مسؤول ثناره", phone });
      }
    }
  } catch {
    // The environment allowlist below remains available if MongoDB is unavailable.
  }

  for (const value of (process.env.WA_ADMIN_PHONES ?? "").split(",")) {
    const phone = normalizePhoneE164(value);
    if (phone && !admins.has(phone)) {
      admins.set(phone, { name: "مسؤول ثناره", phone });
    }
  }

  return [...admins.values()];
}

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
