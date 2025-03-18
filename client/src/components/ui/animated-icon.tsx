import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedIconProps {
  children: ReactNode;
  color?: string;
  size?: "sm" | "md" | "lg";
  animation?: "pulse" | "bounce" | "spin" | "shake";
  className?: string;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const animations = {
  pulse: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  bounce: {
    initial: { y: 0 },
    animate: {
      y: ["0%", "-20%", "0%"],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  spin: {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      },
    },
  },
  shake: {
    initial: { x: 0 },
    animate: {
      x: [-2, 2, -2, 2, 0],
      transition: {
        duration: 0.4,
        repeat: Infinity,
      },
    },
  },
};

export function AnimatedIcon({
  children,
  color,
  size = "md",
  animation = "pulse",
  className,
}: AnimatedIconProps) {
  const selectedAnimation = animations[animation];

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${sizeMap[size]} ${className || ""}`}
      style={{ color }}
      initial={selectedAnimation.initial}
      animate={selectedAnimation.animate}
    >
      {children}
    </motion.div>
  );
}