/**
 * Configuration for ad placement and frequency zones.
 * We prioritize a clean, uncluttered reading experience.
 */

export const AD_ZONES = {
    HOME_DISCOVERY: 'home_discovery',
    LISTING_GRID: 'listing_grid',
    READER_TOP: 'reader_top',
    READER_MID: 'reader_mid',
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
    type: 'subscription' | 'inklet' | 'featured' | 'internal';
}

export const MOCK_ADS: MockAd[] = [
    {
        id: 'plus-upsell-1',
        title: 'Vellum Plus Subscription',
        description: 'Read ad-free and support creators with a weekly archive contribution.',
        cta: 'Go Plus',
        link: '/pro',
        type: 'subscription',
    },
    {
        id: 'inklet-pack-1',
        title: 'Archival Inklets',
        description: 'Acquire Inklets to unlock early access units and tip your favorite chroniclers.',
        cta: 'Get Inklets',
        link: '/premium',
        type: 'inklet',
    },
    {
        id: 'dynamic-featured',
        title: 'Featured Chronicle',
        description: 'The archives are expanding. Find your next journey today.',
        cta: 'Read Now',
        link: '/novel',
        type: 'featured',
    }
];

export const getAdForZone = (zone: string, preferredType?: MockAd['type']): MockAd => {
    if (preferredType) {
        const filtered = MOCK_ADS.filter(ad => ad.type === preferredType);
        if (filtered.length > 0) {
            return filtered[Math.floor(Math.random() * filtered.length)];
        }
    }
    
    // Default rotation logic
    const index = Math.floor(Math.random() * MOCK_ADS.length);
    return MOCK_ADS[index];
};
