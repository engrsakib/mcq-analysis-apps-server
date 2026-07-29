export function maskPhoneNumber(phone: string): string {
  if (!phone) return phone;

  if (phone.length <= 8) {
    const keepStart = Math.min(2, phone.length);
    const keepEnd = Math.min(2, phone.length - keepStart);
    return `${phone.slice(0, keepStart)}***${phone.slice(-keepEnd || undefined)}`;
  }

  return `${phone.slice(0, 5)}***${phone.slice(-3)}`;
}
