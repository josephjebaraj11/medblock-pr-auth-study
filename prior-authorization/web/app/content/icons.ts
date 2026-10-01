/**
 * The icon vocabulary available to content files. Content stays free of React
 * imports; `~/components/ui/Icon` maps these names onto lucide components.
 */
export const ICON_NAMES = [
  "activity",
  "alarm-clock",
  "bar-chart",
  "bot",
  "brain",
  "building",
  "calendar-clock",
  "check-circle",
  "clipboard-list",
  "clock",
  "file-search",
  "file-text",
  "gauge",
  "git-merge",
  "heart-pulse",
  "lock",
  "mail",
  "map-pin",
  "message-square",
  "plug",
  "radar",
  "refresh-cw",
  "scale",
  "send",
  "shield-check",
  "sparkles",
  "stethoscope",
  "trending-down",
  "trending-up",
  "upload",
  "users",
  "zap",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
