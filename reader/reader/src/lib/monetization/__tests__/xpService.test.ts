import { getLevelFromXP, getProgressToNextLevel } from '../xpService';

jest.mock('@/lib/firebase', () => ({
    db: {}
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    Timestamp: {
        now: jest.fn(() => ({ toMillis: () => Date.now() }))
    }
}));

describe('xpService Unit Tests', () => {
    describe('getLevelFromXP', () => {
        test('should return Level 0 for 0 XP', () => {
            expect(getLevelFromXP(0)).toBe(0);
        });

        test('should return Level 0 for XP just below Level 1 threshold', () => {
            expect(getLevelFromXP(49)).toBe(0);
        });

        test('should return Level 1 for exactly Level 1 threshold', () => {
            expect(getLevelFromXP(50)).toBe(1);
        });

        test('should return Level 9 for exactly Level 9 threshold', () => {
            expect(getLevelFromXP(3600)).toBe(9);
        });

        test('should cap at Level 9 even with massive XP (until Ascension)', () => {
            expect(getLevelFromXP(99999)).toBe(9);
        });
    });

    describe('getProgressToNextLevel', () => {
        test('should calculate progress for Level 0 correctly', () => {
            const progress = getProgressToNextLevel(25);
            expect(progress.current).toBe(25);
            expect(progress.required).toBe(50);
            expect(progress.pct).toBe(50);
            expect(progress.isAtCap).toBe(false);
        });

        test('should calculate progress for higher levels correctly', () => {
            // Level 1: 50 -> 150 (needed: 100)
            const progress = getProgressToNextLevel(75);
            expect(progress.current).toBe(25); // 75 - 50
            expect(progress.required).toBe(100);
            expect(progress.pct).toBe(25);
        });

        test('should return isAtCap true for Level 9+', () => {
            const progress = getProgressToNextLevel(4000);
            expect(progress.isAtCap).toBe(true);
            expect(progress.pct).toBe(100);
        });
    });
});
