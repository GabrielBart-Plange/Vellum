# Comic/Manga/Manhwa Integration Strategy

## Overview
Adding sequential visual content (comics, manga, manhwa) to Vellum's Art Gallery with paywall functionality.

## Technical Architecture

### Data Model Extension
Extend existing `ArtPiece` type to support sequential content:

```typescript
interface ArtPiece {
  // ... existing fields
  type: 'single' | 'sequential';  // NEW: Distinguish single vs sequential
  pages?: {
    imageUrl: string;
    order: number;
    isPremium?: boolean;
  }[];
  chapterNumber?: number;  // NEW: For series organization
  seriesId?: string;       // NEW: Link to parent series
  price?: number;          // NEW: Unlock pricing
  isPremium?: boolean;     // NEW: Paywall flag
}
```

### Paywall Strategy Options

#### Option A: Per-Chapter Unlocks
- First 3-5 pages free (preview)
- Full chapter unlock: 5-15 Inklets
- Authors get 70% cut (same as novel chapters)

#### Option B: Subscription Integration
- **Plus**: Early access (24h before free users)
- **Pro**: 3 free premium chapters/month (like Pro Pool)
- Free users: 72h delay on new chapters

#### Option C: Hybrid (Recommended)
- Chapter 1: Free (hook)
- Chapters 2+: 5 Inklets OR Plus subscription
- Full series bundle: 50% discount vs per-chapter

## UI/UX Components

### Reader Experience
- **Vertical Scroll**: Default for manhwa/webtoon style
- **Pagination Mode**: Option for traditional manga
- **Lazy Loading**: Critical for 50+ page chapters
- **Progress Tracking**: Page-level reading progress

### Discovery Integration
- Add "Comics/Manga" filter to Art Gallery
- Series landing pages (like `/novel/[slug]`)
- Chapter navigation and series metadata

## Implementation Phases

### Phase 1: Data Layer (Week 1)
- [ ] Extend ArtPiece schema with sequential support
- [ ] Create manga upload flow for creators
- [ ] Set up image optimization pipeline

### Phase 2: Reader Component (Week 2)
- [ ] Build MangaReader with vertical scroll
- [ ] Integrate paywall overlay (reuse chapter unlock)
- [ ] Add chapter navigation

### Phase 3: Discovery & Navigation (Week 3)
- [ ] Add comics filter to Art Gallery
- [ ] Create series landing pages
- [ ] Implement search indexing

### Phase 4: Creator Tools (Week 4)
- [ ] Extend creator dashboard with manga upload
- [ ] Chapter management interface
- [ ] Analytics for page views and unlocks

## Technical Considerations

### Image Optimization
- Use Cloudinary or Firebase Storage with WebP
- Implement responsive image loading
- Blur placeholders for better UX

### Mobile Priority
- 80% of manga readers use mobile
- Touch gestures for page navigation
- Responsive layout for various screen sizes

### Performance
- Lazy load pages with Intersection Observer
- Preload next chapter pages
- Optimize for 50+ page chapters

## Monetization Integration

### Currency System
- Reuse existing Inklet/Gilt economy
- Align pricing with chapter unlocks (5-15 Inklets)
- Maintain 70% creator revenue share

### Subscription Synergy
- Leverage existing Plus/Pro tiers
- Add manga chapters to Pro Pool
- Early access for Plus subscribers

## Differentiation from Art Gallery

| Feature | Art Gallery | Comics/Manga |
|---------|-------------|--------------|
| Content | Single images | Sequential pages |
| Reading | Lightbox | Scroll/pagination |
| Monetization | Save/Repost (Plus) | Per-chapter unlocks |
| Engagement | Comments | Chapter discussions |
| Discovery | Tags | Series + chapters |

## Success Metrics
- Chapter unlock conversion rate
- Pages per session
- Series completion rate
- Creator earnings from sequential content

## Risks & Mitigations

### Technical Risks
- **Image loading performance**: Implement aggressive lazy loading
- **Storage costs**: Optimize images and use CDN
- **Mobile experience**: Prioritize responsive design

### Content Risks
- **Copyright**: Implement reporting system
- **Quality standards**: Creator guidelines for uploads
- **Content warnings**: Extend rating system for visual content

## Next Steps
1. Finalize data model schema
2. Create technical specification for MangaReader component
3. Set up image optimization pipeline
4. Begin Phase 1 implementation
