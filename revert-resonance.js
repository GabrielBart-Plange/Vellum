const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'src/components/reader/SystemNotation.tsx',
    reps: [
      ['ARCHIVE RESONANCE', 'ARCHIVE NOTIFICATION'],
      ['Inline resonances are being etched', 'Inline comments are being etched'],
    ]
  },
  {
    file: 'src/components/home/GenreGrid.tsx',
    reps: [
      ['Find Your Resonance', 'Find Your Story']
    ]
  },
  {
    file: 'src/components/interactions/LikeButton.tsx',
    reps: [
      ['{likeCount} Resonance', '{likeCount} Likes']
    ]
  },
  {
    file: 'src/components/interactions/CommentSection.tsx',
    reps: [
      ['Resonances ({comments.length})', 'Comments ({comments.length})'],
      ['Inscribe your resonance', 'Inscribe your thoughts']
    ]
  },
  {
    file: 'src/app/art/page.tsx',
    reps: [
      ['match your resonance', 'match your search'],
      ['Reset Resonance', 'Reset Filters']
    ]
  },
  {
    file: 'src/app/tag/[slug]/page.tsx',
    reps: [
      ['This resonance is currently silent', 'This tag is currently empty']
    ]
  },
  {
    file: 'src/app/stories/page.tsx',
    reps: [
      ['different resonance?', 'different filter?'],
      ['Reset Resonance', 'Reset Filters']
    ]
  },
  {
    file: 'src/app/stories/[id]/page.tsx',
    reps: [
      ['Resonances', 'Views'],
      ['resonance balance', 'Inklet balance'] // "Unlock failed. Check your resonance balance."
    ]
  },
  {
    file: 'src/app/settings/page.tsx',
    reps: [
      ['tune your resonance', 'tune your experience'],
      ['Active Resonance', 'Active Theme']
    ]
  },
  {
    file: 'src/app/ranking/page.tsx',
    reps: [
      ['Resonance Score', 'Popularity Score']
    ]
  },
  {
    file: 'src/app/portal/page.tsx',
    reps: [
      ['finds its resonance', 'finds their story'],
      ['resonance with authors', 'connect with authors'],
      ['Join Resonance', 'Join the Community']
    ]
  },
  {
    file: 'src/app/page.tsx',
    reps: [
      ['Resonance Goal', 'Community Goal'],
      ['collective resonance', 'community']
    ]
  },
  {
    file: 'src/app/novel/page.tsx',
    reps: [
      ['match your current resonance.', 'match your current filters.'],
      ['different resonance?', 'different filters?'],
      ['Reset Resonance', 'Reset Filters']
    ]
  },
  {
    file: 'src/app/novel/[slug]/page.tsx',
    reps: [
      ['Resonance</p>', 'Likes</p>']
    ]
  },
  {
    file: 'src/app/nexus/page.tsx',
    reps: [
      ['Tune your resonance', 'Customize your experience']
    ]
  },
  {
    file: 'src/app/chapter/[combined]/page.tsx',
    reps: [
      ['Kindred Resonance', 'Similar Stories'],
      ['Rate the Resonance', 'Rate the Chapter']
    ]
  },
  {
    file: 'src/app/authors/[id]/page.tsx',
    reps: [
      ['Resonances</p>', 'Total Likes</p>'] // "Resonances"
    ]
  }
];

let changedFiles = 0;

replacements.forEach(({ file, reps }) => {
  const fullPath = path.join(__dirname, 'reader', 'reader', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    
    reps.forEach(([find, replace]) => {
      content = content.split(find).join(replace);
    });

    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated ${file}`);
      changedFiles++;
    } else {
      console.log(`No changes made to ${file} (Search string not found)`);
    }
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log(`Done. Updated ${changedFiles} files.`);
