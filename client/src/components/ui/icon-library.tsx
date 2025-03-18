import { AnimatedIcon } from "./animated-icon";
import {
  ShoppingCart,
  Heart,
  Star,
  Bell,
  Check,
  ArrowRight,
  Gift,
  Sparkles,
  Zap,
  Trophy
} from "lucide-react";

interface IconLibraryProps {
  onSelect?: (iconName: string) => void;
}

const icons = [
  { name: "cart", component: ShoppingCart, color: "#4285F4", animation: "bounce" },
  { name: "heart", component: Heart, color: "#EA4335", animation: "pulse" },
  { name: "star", component: Star, color: "#FBBC05", animation: "spin" },
  { name: "bell", component: Bell, color: "#34A853", animation: "shake" },
  { name: "check", component: Check, color: "#4285F4", animation: "bounce" },
  { name: "arrow", component: ArrowRight, color: "#EA4335", animation: "pulse" },
  { name: "gift", component: Gift, color: "#FBBC05", animation: "bounce" },
  { name: "sparkles", component: Sparkles, color: "#34A853", animation: "pulse" },
  { name: "zap", component: Zap, color: "#4285F4", animation: "shake" },
  { name: "trophy", component: Trophy, color: "#EA4335", animation: "bounce" },
] as const;

export function IconLibrary({ onSelect }: IconLibraryProps) {
  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {icons.map((icon) => (
        <button
          key={icon.name}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
          onClick={() => onSelect?.(icon.name)}
        >
          <AnimatedIcon
            color={icon.color}
            animation={icon.animation as "pulse" | "bounce" | "spin" | "shake"}
          >
            <icon.component />
          </AnimatedIcon>
          <span className="mt-1 text-xs text-muted-foreground">
            {icon.name}
          </span>
        </button>
      ))}
    </div>
  );
}
