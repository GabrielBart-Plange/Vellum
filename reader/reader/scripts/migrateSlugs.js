require('dotenv').config();
const admin = require('firebase-admin');

function slugify(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function migrateSlugs(collectionName) {
    console.log(`Migrating ${collectionName}...`);
    const snap = await db.collection(collectionName).get();
    
    const batch = db.batch();
    let count = 0;
    const storyGroupCounters = {};

    if (collectionName === 'novels') {
        const existingWithId = await db.collection('novels')
            .orderBy('numericalId', 'desc')
            .limit(1)
            .get();
        if (!existingWithId.empty) {
            nextNumId = (existingWithId.docs[0].data().numericalId || 999) + 1;
        }
    } else if (collectionName === 'stories') {
        // Pre-scan existing alphanumericIds to get the next numbers
        const existingWithAlpha = await db.collection('stories')
            .where('alphanumericId', '!=', null)
            .get();
        existingWithAlpha.forEach(d => {
            const aid = d.data().alphanumericId;
            if (aid && typeof aid === 'string') {
                const letter = aid[0].toUpperCase();
                const num = parseInt(aid.substring(1));
                if (!isNaN(num)) {
                    storyGroupCounters[letter] = Math.max(storyGroupCounters[letter] || 0, num);
                }
            }
        });
    }

    snap.forEach(doc => {
        const data = doc.data();
        let update = {};
        let needsUpdate = false;

        if (!data.slug && data.title) {
            update.slug = slugify(data.title);
            needsUpdate = true;
        }

        if (data.published !== true) {
            update.published = true; // Default to true for existing content
            needsUpdate = true;
        }

        if (collectionName === 'novels' && !data.numericalId) {
            update.numericalId = nextNumId++;
            needsUpdate = true;
        }

        if (collectionName === 'stories' && !data.alphanumericId && data.title) {
            const firstLetter = data.title.trim()[0].toUpperCase();
            if (/[A-Z]/.test(firstLetter)) {
                storyGroupCounters[firstLetter] = (storyGroupCounters[firstLetter] || 0) + 1;
                update.alphanumericId = `${firstLetter}${storyGroupCounters[firstLetter]}`;
                needsUpdate = true;
            } else {
                // Fallback for non-alphabetic titles
                storyGroupCounters['X'] = (storyGroupCounters['X'] || 0) + 1;
                update.alphanumericId = `X${storyGroupCounters['X']}`;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            batch.update(doc.ref, update);
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Successfully updated ${count} documents in ${collectionName}.`);
    } else {
        console.log(`No updates needed for ${collectionName}.`);
    }
}

async function run() {
    try {
        await migrateSlugs('novels');
        await migrateSlugs('stories');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

run();
