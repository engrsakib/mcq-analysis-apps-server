export function normalizePhoneNumber(number: string): string {
  const digits = number.replace(/\D/g, "");

  if (digits.startsWith("880")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `88${digits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `880${digits.replace(/^0/, "")}`;
  }

  return digits;
}
