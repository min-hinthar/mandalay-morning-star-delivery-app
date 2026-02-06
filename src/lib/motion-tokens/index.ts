/**
 * V7 Motion Token System
 * Maximum playfulness, 120fps target, ultra-smooth animations
 *
 * Philosophy:
 * - Every element should feel alive
 * - Springs over easings for natural motion
 * - Faster durations for 120fps smoothness
 * - Bounce and overshoot encouraged
 *
 * @example
 * import { spring, variants, hover } from '@/lib/motion-tokens';
 * <motion.div {...hover.lift} variants={variants.popIn} />
 */

export * from './core';
export * from './variants';
export * from './stagger';
export * from './effects';
export * from './scroll';
export * from './cards';
export * from './utilities';
