const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Normalize a phone input to E.164, applying the portal's Saudi local-number default. */
export function normalizePhoneE164(value: string): string | null {
  const input = value
    .trim()
    .replace(/[٠-٩۰-۹]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(digit) % 10));
  if (!input || /[^\d+\s().-]/.test(input)) return null;

  let compact = input.replace(/[\s().-]/g, "");
  if ((compact.match(/\+/g) ?? []).length > 1 || (compact.includes("+") && !compact.startsWith("+"))) {
    return null;
  }
  if (compact.startsWith("00")) compact = `+${compact.slice(2)}`;

  if (/^05\d{8}$/.test(compact)) compact = `+966${compact.slice(1)}`;
  else if (/^5\d{8}$/.test(compact)) compact = `+966${compact}`;
  else if (/^966\d{8,10}$/.test(compact)) compact = `+${compact}`;
  else if (/^\d{8,15}$/.test(compact)) compact = `+${compact}`;

  return E164_PATTERN.test(compact) ? compact : null;
}

/** Return exact representations used by current and older account records. */
export function phoneLookupValues(value: string): string[] {
  const e164 = normalizePhoneE164(value);
  if (!e164) return [];

  const digits = e164.slice(1);
  const values = [e164, digits, `00${digits}`];
  if (digits.startsWith("966")) {
    const national = digits.slice(3);
    values.push(`0${national}`, national);
  }
  return [...new Set(values)];
}

export function normalizePhoneDigits(value: string): string {
  return normalizePhoneE164(value)?.slice(1) ?? value.replace(/\D/g, "");
}
