export function normalizePhoneInput(input: string): string {
  let phone = input
    .trim()
    .replace(/[٠-٩۰-۹]/g, digit => String("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(digit) % 10))
    .replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (/^05\d{8}$/.test(phone)) return `+966${phone.slice(1)}`;
  if (/^5\d{8}$/.test(phone)) return `+966${phone}`;
  if (/^966\d{8,10}$/.test(phone)) return `+${phone}`;
  return phone;
}

export function isInternationalPhone(input: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(input);
}

export function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, digit => String("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(digit) % 10));
}
