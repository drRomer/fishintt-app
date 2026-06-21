// Simple className merger (sin clsx para minimizar deps)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
