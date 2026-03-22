try {
    const firebase = require('firebase');
    console.log('Firebase loaded successfully');
} catch (e) {
    console.error('Failed to load firebase:', e.message);
}
