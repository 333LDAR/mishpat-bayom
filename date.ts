export const ISRAEL_TIME_ZONE = "Asia/Jerusalem";

export function israelDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISRAEL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatHebrewDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: ISRAEL_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00+03:00`));
}
