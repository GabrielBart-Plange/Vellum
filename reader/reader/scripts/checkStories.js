require('dotenv').config();
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function checkStories() {
    console.log("Checking stories...");
    const snap = await db.collection('stories').get();
    let unpublishedCount = 0;
    let publishedCount = 0;
    let missingPublishedField = 0;

    snap.forEach(doc => {
        const data = doc.data();
        if (data.published === true) publishedCount++;
        else if (data.published === false) unpublishedCount++;
        else missingPublishedField++;
        
        if (data.published !== true) {
            console.log(`Story [${doc.id}] "${data.title}" - published: ${data.published}`);
        }
    });

    console.log(`Summary:`);
    console.log(`- Published: ${publishedCount}`);
    console.log(`- Unpublished (false): ${unpublishedCount}`);
    console.log(`- Missing field: ${missingPublishedField}`);
}

checkStories();
