export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return value.trim();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidIndianPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
}

export function yearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 83 }, (_unused, index) => String(currentYear - 18 - index));
}

export function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  return String(value);
}

export function yesNo(value: boolean) {
  return value ? 'Yes' : 'No';
}
