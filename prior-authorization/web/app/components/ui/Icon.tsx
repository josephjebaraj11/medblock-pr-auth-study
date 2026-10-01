import {
  Activity,
  AlarmClock,
  BarChart3,
  Bot,
  Brain,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileSearch,
  FileText,
  Gauge,
  GitMerge,
  HeartPulse,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Plug,
  Radar,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { IconName } from "~/content/icons";
import { cn } from "~/lib/utils";

const ICONS: Record<IconName, LucideIcon> = {
  activity: Activity,
  "alarm-clock": AlarmClock,
  "bar-chart": BarChart3,
  bot: Bot,
  brain: Brain,
  building: Building2,
  "calendar-clock": CalendarClock,
  "check-circle": CheckCircle2,
  "clipboard-list": ClipboardList,
  clock: Clock,
  "file-search": FileSearch,
  "file-text": FileText,
  gauge: Gauge,
  "git-merge": GitMerge,
  "heart-pulse": HeartPulse,
  lock: Lock,
  mail: Mail,
  "map-pin": MapPin,
  "message-square": MessageSquare,
  plug: Plug,
  radar: Radar,
  "refresh-cw": RefreshCw,
  scale: Scale,
  send: Send,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  stethoscope: Stethoscope,
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  upload: Upload,
  users: Users,
  zap: Zap,
};

type IconProps = {
  name: IconName;
  className?: string;
};

/** Icons are always decorative here — the adjacent text carries the meaning. */
export function Icon({ name, className }: IconProps) {
  const Component = ICONS[name];
  return <Component aria-hidden="true" className={cn("h-5 w-5", className)} />;
}
