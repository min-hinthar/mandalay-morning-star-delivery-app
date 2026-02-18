import type { MorphingMenuProps } from "./MorphingMenu";

export const createVariants = (variant: MorphingMenuProps["variant"], lineHeight: number) => {
  const gap = lineHeight * 2.5;

  switch (variant) {
    case "arrow":
      return {
        top: {
          closed: { rotate: 0, y: 0, width: "100%" },
          open: { rotate: 45, y: gap, width: "50%", originX: 0 },
        },
        middle: {
          closed: { scaleX: 1, opacity: 1 },
          open: { scaleX: 1, opacity: 1, x: 4 },
        },
        bottom: {
          closed: { rotate: 0, y: 0, width: "100%" },
          open: { rotate: -45, y: -gap, width: "50%", originX: 0 },
        },
      };

    case "rotate":
      return {
        top: {
          closed: { rotate: 0, y: 0 },
          open: { rotate: 135, y: gap },
        },
        middle: {
          closed: { scaleX: 1, opacity: 1 },
          open: { scaleX: 0, opacity: 0 },
        },
        bottom: {
          closed: { rotate: 0, y: 0 },
          open: { rotate: -135, y: -gap },
        },
      };

    case "rounded":
      return {
        top: {
          closed: { rotate: 0, y: 0, borderRadius: "2px" },
          open: { rotate: 45, y: gap, borderRadius: "4px" },
        },
        middle: {
          closed: { scaleX: 1, opacity: 1, borderRadius: "2px" },
          open: { scaleX: 0, opacity: 0, borderRadius: "4px" },
        },
        bottom: {
          closed: { rotate: 0, y: 0, borderRadius: "2px" },
          open: { rotate: -45, y: -gap, borderRadius: "4px" },
        },
      };

    default:
      return {
        top: {
          closed: { rotate: 0, y: 0 },
          open: { rotate: 45, y: gap },
        },
        middle: {
          closed: { scaleX: 1, opacity: 1 },
          open: { scaleX: 0, opacity: 0 },
        },
        bottom: {
          closed: { rotate: 0, y: 0 },
          open: { rotate: -45, y: -gap },
        },
      };
  }
};
