require('dotenv').config();
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function listStories() {
    console.log("Listing stories...");
    const snap = await db.collection('stories').get();
    
    snap.forEach(doc => {
        const d = doc.data();
        console.log(`- [${doc.id}] ${d.title} | alpha: ${d.alphanumericId} | slug: ${d.slug} | pub: ${d.published}`);
    });
}

listStories();
