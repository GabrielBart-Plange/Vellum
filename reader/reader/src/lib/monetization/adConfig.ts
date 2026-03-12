/**
 * Configuration for ad placement and frequency zones.
 * We prioritize a clean, uncluttered reading experience.
 */

export const AD_ZONES = {
    HOME_DISCOVERY: 'home_discovery',
    LISTING_GRID: 'listing_grid',
    READER_AFTER_CHAPTER: 'reader_after_chapter',
    SIDEBAR_FOOTER: 'sidebar_footer',
};

export interface MockAd {
    id: string;
    title: string;
    description: string;
    cta: string;
    link: string;
    image?: string;
    type: 'subscription' | 'coin' | 'featured' | 'internal';
}

export const MOCK_ADS: MockAd[] = [
    {
        id: 'prime-upsell-1',
        title: 'Support Your Favorite Authors',
        description: 'Go Prime for GHS 15 and read ad-free for an entire month.',
        cta: 'Go Prime',
        link: '/premium',
        type: 'subscription',
    },
    {
        id: 'coin-pack-1',
        title: 'Essence Coins Available',
        description: 'Unlock early access chapters and tip creators with Essence Coins.',
        cta: 'Get Coins',
        link: '/premium',
        type: 'coin',
    },
    {
        id: 'featured-story-1',
        title: 'New Chronicle: The Void Walkers',
        description: 'A dark mystery that challenges everything you know about the archive.',
        cta: 'Read Now',
        link: '/novels/void-walkers',
        type: 'featured',
    }
];

export const getAdForZone = (zone: string): MockAd => {
    // Simple logic to rotate or pick specific ads based on zone
    // For now, we rotate
    const index = Math.floor(Math.random() * MOCK_ADS.length);
    return MOCK_ADS[index];
};
