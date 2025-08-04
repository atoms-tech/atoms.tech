import {
    staggerChildren,
    fadeIn,
    slideIn,
    scaleIn,
    rotateIn,
    bounceIn,
    slideInFromDirection,
    createStaggerVariants,
    createSpringAnimation,
    createEaseAnimation,
} from '../animations';

describe('animations utils', () => {
    describe('staggerChildren', () => {
        it('should create stagger animation with default delay', () => {
            const result = staggerChildren();
            
            expect(result).toEqual({
                animate: {
                    transition: {
                        staggerChildren: 0.1,
                    },
                },
            });
        });

        it('should create stagger animation with custom delay', () => {
            const result = staggerChildren(0.2);
            
            expect(result).toEqual({
                animate: {
                    transition: {
                        staggerChildren: 0.2,
                    },
                },
            });
        });

        it('should handle zero delay', () => {
            const result = staggerChildren(0);
            
            expect(result).toEqual({
                animate: {
                    transition: {
                        staggerChildren: 0,
                    },
                },
            });
        });

        it('should handle very large delay', () => {
            const result = staggerChildren(5);
            
            expect(result).toEqual({
                animate: {
                    transition: {
                        staggerChildren: 5,
                    },
                },
            });
        });
    });

    describe('fadeIn', () => {
        it('should create fade in animation with default duration', () => {
            const result = fadeIn();
            
            expect(result).toEqual({
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.3 },
            });
        });

        it('should create fade in animation with custom duration', () => {
            const result = fadeIn(0.5);
            
            expect(result).toEqual({
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.5 },
            });
        });

        it('should handle zero duration', () => {
            const result = fadeIn(0);
            
            expect(result).toEqual({
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0 },
            });
        });
    });

    describe('slideIn', () => {
        it('should create slide in animation with default values', () => {
            const result = slideIn();
            
            expect(result).toEqual({
                initial: { x: -100, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: -100, opacity: 0 },
                transition: { duration: 0.3 },
            });
        });

        it('should create slide in animation with custom direction and duration', () => {
            const result = slideIn('right', 0.5);
            
            expect(result).toEqual({
                initial: { x: 100, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: 100, opacity: 0 },
                transition: { duration: 0.5 },
            });
        });

        it('should handle up direction', () => {
            const result = slideIn('up');
            
            expect(result).toEqual({
                initial: { y: 100, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: 100, opacity: 0 },
                transition: { duration: 0.3 },
            });
        });

        it('should handle down direction', () => {
            const result = slideIn('down');
            
            expect(result).toEqual({
                initial: { y: -100, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: -100, opacity: 0 },
                transition: { duration: 0.3 },
            });
        });
    });

    describe('scaleIn', () => {
        it('should create scale in animation with default values', () => {
            const result = scaleIn();
            
            expect(result).toEqual({
                initial: { scale: 0.8, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 0.8, opacity: 0 },
                transition: { duration: 0.3 },
            });
        });

        it('should create scale in animation with custom scale and duration', () => {
            const result = scaleIn(0.5, 0.4);
            
            expect(result).toEqual({
                initial: { scale: 0.5, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 0.5, opacity: 0 },
                transition: { duration: 0.4 },
            });
        });

        it('should handle zero scale', () => {
            const result = scaleIn(0);
            
            expect(result).toEqual({
                initial: { scale: 0, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 0, opacity: 0 },
                transition: { duration: 0.3 },
            });
        });
    });

    describe('rotateIn', () => {
        it('should create rotate in animation with default values', () => {
            const result = rotateIn();
            
            expect(result).toEqual({
                initial: { rotate: -180, opacity: 0 },
                animate: { rotate: 0, opacity: 1 },
                exit: { rotate: -180, opacity: 0 },
                transition: { duration: 0.3 },
            });
        });

        it('should create rotate in animation with custom rotation and duration', () => {
            const result = rotateIn(90, 0.5);
            
            expect(result).toEqual({
                initial: { rotate: 90, opacity: 0 },
                animate: { rotate: 0, opacity: 1 },
                exit: { rotate: 90, opacity: 0 },
                transition: { duration: 0.5 },
            });
        });

        it('should handle zero rotation', () => {
            const result = rotateIn(0);
            
            expect(result).toEqual({
                initial: { rotate: 0, opacity: 0 },
                animate: { rotate: 0, opacity: 1 },
                exit: { rotate: 0, opacity: 0 },
                transition: { duration: 0.3 },
            });
        });
    });

    describe('bounceIn', () => {
        it('should create bounce in animation with default duration', () => {
            const result = bounceIn();
            
            expect(result).toEqual({
                initial: { scale: 0, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 0, opacity: 0 },
                transition: {
                    duration: 0.5,
                    type: 'spring',
                    bounce: 0.5,
                },
            });
        });

        it('should create bounce in animation with custom duration', () => {
            const result = bounceIn(0.8);
            
            expect(result).toEqual({
                initial: { scale: 0, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 0, opacity: 0 },
                transition: {
                    duration: 0.8,
                    type: 'spring',
                    bounce: 0.5,
                },
            });
        });
    });

    describe('slideInFromDirection', () => {
        it('should handle left direction', () => {
            const result = slideInFromDirection('left', 200, 0.4);
            
            expect(result).toEqual({
                initial: { x: -200, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: -200, opacity: 0 },
                transition: { duration: 0.4 },
            });
        });

        it('should handle right direction', () => {
            const result = slideInFromDirection('right', 200, 0.4);
            
            expect(result).toEqual({
                initial: { x: 200, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: 200, opacity: 0 },
                transition: { duration: 0.4 },
            });
        });

        it('should handle up direction', () => {
            const result = slideInFromDirection('up', 200, 0.4);
            
            expect(result).toEqual({
                initial: { y: -200, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: -200, opacity: 0 },
                transition: { duration: 0.4 },
            });
        });

        it('should handle down direction', () => {
            const result = slideInFromDirection('down', 200, 0.4);
            
            expect(result).toEqual({
                initial: { y: 200, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: 200, opacity: 0 },
                transition: { duration: 0.4 },
            });
        });

        it('should use default values when not provided', () => {
            const result = slideInFromDirection('left');
            
            expect(result).toEqual({
                initial: { x: -100, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: -100, opacity: 0 },
                transition: { duration: 0.3 },
            });
        });
    });

    describe('createStaggerVariants', () => {
        it('should create stagger variants with default values', () => {
            const result = createStaggerVariants();
            
            expect(result).toEqual({
                container: {
                    animate: {
                        transition: {
                            staggerChildren: 0.1,
                        },
                    },
                },
                item: {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: 20 },
                },
            });
        });

        it('should create stagger variants with custom values', () => {
            const result = createStaggerVariants(0.2, 50);
            
            expect(result).toEqual({
                container: {
                    animate: {
                        transition: {
                            staggerChildren: 0.2,
                        },
                    },
                },
                item: {
                    initial: { opacity: 0, y: 50 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: 50 },
                },
            });
        });
    });

    describe('createSpringAnimation', () => {
        it('should create spring animation with default values', () => {
            const result = createSpringAnimation();
            
            expect(result).toEqual({
                type: 'spring',
                stiffness: 300,
                damping: 30,
            });
        });

        it('should create spring animation with custom values', () => {
            const result = createSpringAnimation(400, 40);
            
            expect(result).toEqual({
                type: 'spring',
                stiffness: 400,
                damping: 40,
            });
        });

        it('should handle zero values', () => {
            const result = createSpringAnimation(0, 0);
            
            expect(result).toEqual({
                type: 'spring',
                stiffness: 0,
                damping: 0,
            });
        });
    });

    describe('createEaseAnimation', () => {
        it('should create ease animation with default values', () => {
            const result = createEaseAnimation();
            
            expect(result).toEqual({
                duration: 0.3,
                ease: 'easeInOut',
            });
        });

        it('should create ease animation with custom values', () => {
            const result = createEaseAnimation(0.5, 'easeIn');
            
            expect(result).toEqual({
                duration: 0.5,
                ease: 'easeIn',
            });
        });

        it('should handle custom cubic bezier ease', () => {
            const customEase = [0.25, 0.1, 0.25, 1] as const;
            const result = createEaseAnimation(0.4, customEase);
            
            expect(result).toEqual({
                duration: 0.4,
                ease: customEase,
            });
        });
    });

    describe('integration tests', () => {
        it('should combine multiple animations', () => {
            const fadeAnimation = fadeIn(0.3);
            const slideAnimation = slideIn('right', 0.3);
            
            // These should be compatible and not conflict
            expect(fadeAnimation.transition.duration).toBe(slideAnimation.transition.duration);
            expect(fadeAnimation.initial.opacity).toBe(slideAnimation.initial.opacity);
        });

        it('should work with stagger and item animations', () => {
            const stagger = staggerChildren(0.1);
            const variants = createStaggerVariants(0.1, 20);
            
            expect(stagger.animate.transition.staggerChildren).toBe(
                variants.container.animate.transition.staggerChildren
            );
        });

        it('should handle extreme values gracefully', () => {
            expect(() => fadeIn(1000)).not.toThrow();
            expect(() => slideIn('left', -1)).not.toThrow();
            expect(() => scaleIn(10, 0.1)).not.toThrow();
            expect(() => rotateIn(720, 2)).not.toThrow();
        });
    });
});
