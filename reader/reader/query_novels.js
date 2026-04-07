const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();
const serviceAccount = JSON.parse(fs.readFileSync('C:\\Users\\gabba\\Downloads\\chronicles-11261-firebase-adminsdk-fbsvc-910b9cd48c.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
db.collection('novels').get().then(snap => {
  console.log('Total novels:', snap.size);
  snap.docs.forEach(doc => {
    const d = doc.data();
    console.log('- Title:', d.title, '| Published:', d.published, '| createdAt:', (!!d.createdAt), '| ID:', doc.id);
  });
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
