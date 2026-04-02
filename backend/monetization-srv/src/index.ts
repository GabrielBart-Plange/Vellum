import express, { Request, Response } from 'express'
import cors from 'cors'
import * as admin from 'firebase-admin'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

const serviceAccount = require('../service-account.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
const db = admin.firestore()

const app = express()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Vellum Monetization Engine is running',
    version: '1.0.0',
    endpoints: [
      '/api/payments/inklets/purchase',
      '/api/chapters/status/:userId/:novelId/:chapterId',
      '/api/chapters/unlock',
      '/api/stories/status/:userId/:storyId',
      '/api/stories/unlock'
    ]
  });
});

// --- Chapter Locking & Unlocking ---

/**
 * GET /api/chapters/status/:userId/:novelId/:chapterId
 * Returns whether a chapter is locked for a specific user.
 */
app.get('/api/chapters/status/:userId/:novelId/:chapterId', async (req: Request, res: Response) => {
  const { userId, novelId, chapterId } = req.params as any;

  try {
    const chapterRef = db.collection('novels').doc(novelId).collection('chapters').doc(chapterId);
    const chapterSnap = await chapterRef.get();

    if (!chapterSnap.exists) {
      return res.status(404).json({ ok: false, error: 'Chapter not found' });
    }

    const chapterData = chapterSnap.data();
    const isPremium = chapterData?.isPremium || false;
    const price = chapterData?.price || 0;

    if (!isPremium) {
      return res.json({ ok: true, locked: false });
    }

    // Author Bypass
    const novelSnap = await db.collection('novels').doc(novelId).get();
    if (novelSnap.data()?.authorId === userId) {
      return res.json({ ok: true, locked: false });
    }

    // Check if user has unlocked it
    const unlockRef = db.collection('users').doc(userId as string).collection('unlockedChapters').doc(chapterId as string);
    const unlockSnap = await unlockRef.get();

    if (unlockSnap.exists) {
      return res.json({ ok: true, locked: false });
    }

    res.json({ ok: true, locked: true, price });
  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/chapters/unlock
 * Logic to unlock a chapter using Inklets.
 */
app.post('/api/chapters/unlock', async (req: Request, res: Response) => {
  const { userId, novelId, chapterId } = req.body as any;

  if (!userId || !novelId || !chapterId) {
    return res.status(400).json({ ok: false, error: 'Missing compulsory fields' });
  }

  try {
    const novelRef = db.collection('novels').doc(novelId);
    const chapterRef = db.collection('novels').doc(novelId).collection('chapters').doc(chapterId);
    const userRef = db.collection('users').doc(userId);
    const unlockRef = db.collection('users').doc(userId).collection('unlockedChapters').doc(chapterId);

    const result = await db.runTransaction(async (transaction) => {
      const [novelSnap, chapterSnap, userSnap, unlockSnap] = await Promise.all([
        transaction.get(novelRef),
        transaction.get(chapterRef),
        transaction.get(userRef),
        transaction.get(unlockRef)
      ]);

      if (!novelSnap.exists || !chapterSnap.exists || !userSnap.exists) {
        throw new Error('Novel, Chapter, or User not found');
      }
      if (unlockSnap.exists) return { alreadyUnlocked: true };

      const chapterData = chapterSnap.data();
      const price = chapterData?.price || 0;
      const userBalance = userSnap.data()?.inkletBalance || 0;

      if (userBalance < price) {
        throw new Error('Insufficient Inklets');
      }

      const creatorId = novelSnap.data()?.authorId;
      if (!creatorId) throw new Error('Creator not found');
      const creatorRef = db.collection('users').doc(creatorId);

      // 1. Deduct from user
      transaction.update(userRef, {
        inkletBalance: admin.firestore.FieldValue.increment(-price),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Grant to creator (65% share)
      const creatorShare = Math.floor(price * 0.65);
      transaction.update(creatorRef, {
        inkletBalance: admin.firestore.FieldValue.increment(creatorShare),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Mark as unlocked
      transaction.set(unlockRef, {
        novelId,
        chapterId,
        unlockedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Increment chapter unlock count
      transaction.update(chapterRef, {
        unlockedBy: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 5. Log transaction
      const transRef = db.collection('transactions').doc();
      transaction.set(transRef, {
        id: transRef.id,
        userId,
        type: 'chapter_unlock',
        novelId,
        chapterId,
        amount: price,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    });

    res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Unlock error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});
// --- Story Locking & Unlocking ---

/**
 * GET /api/stories/status/:userId/:storyId
 */
app.get('/api/stories/status/:userId/:storyId', async (req: Request, res: Response) => {
  const { userId, storyId } = req.params as any;

  try {
    const storyRef = db.collection('stories').doc(storyId as string);
    const storySnap = await storyRef.get();

    if (!storySnap.exists) {
      return res.status(404).json({ ok: false, error: 'Story not found' });
    }

    const storyData = storySnap.data();
    const isPremium = storyData?.isPremium || false;
    const price = storyData?.price || 0;

    if (!isPremium) {
      return res.json({ ok: true, locked: false });
    }

    // Author Bypass
    if (storyData?.authorId === userId || storyData?.creatorId === userId) {
      return res.json({ ok: true, locked: false });
    }

    const unlockRef = db.collection('users').doc(userId as string).collection('unlockedStories').doc(storyId as string);
    const unlockSnap = await unlockRef.get();

    if (unlockSnap.exists) {
      return res.json({ ok: true, locked: false });
    }

    res.json({ ok: true, locked: true, price });
  } catch (error: any) {
    console.error('Story status check error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/stories/unlock
 */
app.post('/api/stories/unlock', async (req: Request, res: Response) => {
  const { userId, storyId } = req.body as any;

  if (!userId || !storyId) {
    return res.status(400).json({ ok: false, error: 'Missing compulsory fields' });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const storyRef = db.collection('stories').doc(storyId);
    const unlockRef = db.collection('users').doc(userId).collection('unlockedStories').doc(storyId);

    const result = await db.runTransaction(async (transaction) => {
      const [userSnap, storySnap, unlockSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(storyRef),
        transaction.get(unlockRef)
      ]);

      if (!storySnap.exists) throw new Error('Story not found');
      if (unlockSnap.exists) return { alreadyUnlocked: true };

      const storyData = storySnap.data();
      const price = storyData?.price || 0;
      const userBalance = userSnap.data()?.inkletBalance || 0;

      if (userBalance < price) {
        throw new Error('Insufficient Inklets');
      }

      const creatorId = storyData?.authorId;
      if (!creatorId) throw new Error('Creator not found');
      const creatorRef = db.collection('users').doc(creatorId);

      // 1. Deduct from user
      transaction.update(userRef, {
        inkletBalance: admin.firestore.FieldValue.increment(-price),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Grant to creator (65% share)
      const creatorShare = Math.floor(price * 0.65);
      transaction.update(creatorRef, {
        inkletBalance: admin.firestore.FieldValue.increment(creatorShare),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Mark as unlocked
      transaction.set(unlockRef, {
        storyId,
        unlockedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Log transaction
      const transRef = db.collection('transactions').doc();
      transaction.set(transRef, {
        id: transRef.id,
        userId,
        type: 'story_unlock',
        storyId,
        amount: price,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    });

    res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Story unlock error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});


// Phase M1 - Inklets & Tips
app.post('/api/payments/inklets/purchase', async (req: Request, res: Response) => {
  const { userId, amount, provider } = req.body

  if (!userId || !amount) {
    return res.status(400).json({ ok: false, error: 'Missing userId or amount' })
  }

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      inkletBalance: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Log transaction
    const transRef = db.collection('transactions').doc();
    await transRef.set({
      userId,
      type: 'inklet_purchase',
      amount,
      provider: provider || 'manual',
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true, message: 'Inklets purchased successfully' })
  } catch (error: any) {
    console.error('Inklet purchase error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// --- Simulated Payment Providers (Paystack & Stripe) ---

/**
 * POST /api/payments/paystack/initialize
 * Simulated Paystack initialization
 */
app.post('/api/payments/paystack/initialize', async (req: Request, res: Response) => {
  const { userId, amount, email } = req.body;
  if (!userId || !amount) return res.status(400).json({ ok: false, error: 'Missing userId or amount' });

  // Simulate returning an authorization URL and reference
  const reference = `pstk_${Math.random().toString(36).substring(7)}`;
  res.json({
    ok: true,
    data: {
      authorization_url: `https://checkout.paystack.com/simulate/${reference}`,
      access_code: reference,
      reference
    }
  });
});

/**
 * POST /api/payments/paystack/verify
 * Real Paystack verification
 */
app.post('/api/payments/paystack/verify', async (req: Request, res: Response) => {
  const { reference, userId, amount, currencyAmount, priceGHS, type } = req.body;
  const finalCurrencyAmount = currencyAmount || priceGHS; // Handle both naming conventions
  
  console.log(`[Paystack Verify] Reference: ${reference}, User: ${userId}, Amount: ${amount}, GHS: ${finalCurrencyAmount}, Type: ${type}`);

  if (!reference || !userId) {
    return res.status(400).json({ ok: false, error: 'Missing reference or userId' });
  }

  try {
    // 1. Verify with Paystack
    const PAYSTACK_IP = '104.18.28.7'; // Resolved via 8.8.8.8
    let response;
    try {
      console.log(`[Paystack Verify] Attempting verification via api.paystack.co...`);
      response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });
    } catch (dnsError: any) {
      if (dnsError.code === 'ENOTFOUND') {
        console.warn(`[Paystack Verify] DNS Failed. Retrying via static IP: ${PAYSTACK_IP}`);
        response = await axios.get(`https://${PAYSTACK_IP}/transaction/verify/${reference}`, {
          headers: { 
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Host': 'api.paystack.co'
          }
        });
      } else {
        throw dnsError;
      }
    }

    if (!response.data.status || response.data.data.status !== 'success') {
      console.error(`[Paystack Verify] Paystack API rejected verification:`, response.data);
      return res.status(400).json({ ok: false, error: 'Payment verification failed' });
    }

    const paystackData = response.data.data;
    console.log(`[Paystack Verify] Paystack Data:`, { status: paystackData.status, amount: paystackData.amount });
    
    // Verify amount (Paystack amount is in pesewas for GHS)
    if (finalCurrencyAmount && Math.abs(paystackData.amount - Math.round(finalCurrencyAmount * 100)) > 1) {
      console.error(`[Paystack Verify] Amount mismatch. Expected: ${Math.round(finalCurrencyAmount * 100)}, Got: ${paystackData.amount}`);
      return res.status(400).json({ ok: false, error: 'Amount mismatch' });
    }

    // 2. Update User Balance in Firestore
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error('User not found');

      const updates: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (type === 'gilt') {
        updates.giltBalance = admin.firestore.FieldValue.increment(amount);
      } else if (type === 'inklets') {
        updates.inkletBalance = admin.firestore.FieldValue.increment(amount);
      } else if (type?.startsWith('sub_')) {
        const tier = type.replace('sub_', '');
        updates.subscriptionTier = tier;
        updates.subscriptionStatus = 'active';
        updates.subscriptionUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      transaction.update(userRef, updates);

      // 3. Record Transaction
      const txRef = db.collection('transactions').doc(reference);
      transaction.set(txRef, {
        userId,
        amount, // This is the coin/item amount
        currencyAmount: finalCurrencyAmount,
        reference,
        type: type || 'inklets',
        provider: 'paystack',
        status: 'success',
        paystackData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[Paystack Verify] Success: ${reference}`);
    res.json({ ok: true, success: true, message: 'Payment verified and balance updated' });
  } catch (error: any) {
    console.error('[Paystack Verify] Error:', error.response?.data || error.message);
    res.status(500).json({ ok: false, error: 'Internal verification error' });
  }
});

/**
 * POST /api/payments/stripe/create-checkout-session
 * Simulated Stripe Checkout
 */
app.post('/api/payments/stripe/create-checkout-session', async (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  const sessionId = `cs_test_${Math.random().toString(36).substring(7)}`;
  
  res.json({
    ok: true,
    id: sessionId,
    url: `https://checkout.stripe.com/pay/${sessionId}`
  });
});

/**
 * POST /api/payments/stripe/verify
 * Simulated Stripe webhook/verification
 */
app.post('/api/payments/stripe/verify', async (req: Request, res: Response) => {
  const { sessionId, userId, amount } = req.body;
  try {
    const userRef = db.collection('users').doc(userId as string);
    await userRef.set({
      inkletBalance: admin.firestore.FieldValue.increment(amount as number),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const transRef = db.collection('transactions').doc();
    await transRef.set({
      userId,
      type: 'inklet_purchase',
      amount,
      provider: 'stripe',
      reference: sessionId,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true, message: 'Stripe payment verified' });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// New - Vellux (Golden Tickets) purchase
app.post('/api/payments/vellux/purchase', async (req: Request, res: Response) => {
  const { userId, tier, provider } = req.body

  if (!userId || !tier) {
    return res.status(400).json({ ok: false, error: 'Missing userId or tier' })
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const amount = 1;
    const fieldName = `vellux_${tier}_balance`;
    
    await userRef.set({
      [fieldName]: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const transRef = db.collection('transactions').doc();
    await transRef.set({
      userId,
      type: 'vellux_purchase',
      tier,
      amount,
      provider: provider || 'manual',
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true, message: `${tier} Vellux purchased successfully` })
  } catch (error: any) {
    console.error('Vellux purchase error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

app.post('/api/creators/:id/tip', async (req: Request, res: Response) => {
  const creatorId = req.params.id
  const { userId, amount, username } = req.body

  if (!userId || !amount || !creatorId) {
    return res.status(400).json({ ok: false, error: 'Missing mandatory fields' })
  }

  try {
    const userRef = db.collection('users').doc(userId as string);
    const creatorRef = db.collection('users').doc(creatorId as string);

    await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error('User not found');
      
      const userBalance = userSnap.data()?.inkletBalance || 0;
      if (userBalance < amount) {
        throw new Error('Insufficient Inklets');
      }

      // Deduct from user
      transaction.update(userRef, {
        inkletBalance: admin.firestore.FieldValue.increment(-amount),
        lifetimeSpent: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Add to creator
      transaction.update(creatorRef, {
        inkletBalance: admin.firestore.FieldValue.increment(amount),
        lifetimeEarned: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Record transaction
      const transRef = db.collection('transactions').doc();
      transaction.set(transRef, {
        id: transRef.id,
        fromId: userId,
        fromName: username || 'Anonymous',
        toId: creatorId,
        type: 'tip',
        amount,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ ok: true, message: 'Tip sent successfully' })
  } catch (error: any) {
    console.error('Tip error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Phase M2 - Gilt (Premium Currency)
app.post('/api/payments/gilt/purchase', async (req: Request, res: Response) => {
  const { userId, amount, provider } = req.body

  if (!userId || !amount) {
    return res.status(400).json({ ok: false, error: 'Missing userId or amount' })
  }

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      giltBalance: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const transRef = db.collection('transactions').doc();
    await transRef.set({
      userId,
      type: 'gilt_purchase',
      amount,
      provider: provider || 'manual',
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true, message: 'Gilt purchased successfully' })
  } catch (error: any) {
    console.error('Gilt purchase error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Subscriptions
app.post('/api/payments/subscribe', async (req: Request, res: Response) => {
  const { userId, tier, provider } = req.body

  if (!userId || !tier) {
    return res.status(400).json({ ok: false, error: 'Missing userId or tier' })
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const expiresAt = new Date();
    if (tier === 'prime') expiresAt.setDate(expiresAt.getDate() + 7);
    else if (tier === 'nexus') expiresAt.setMonth(expiresAt.getMonth() + 1);

    await userRef.set({
      subscriptionTier: tier,
      subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const transRef = db.collection('transactions').doc();
    await transRef.set({
      userId,
      type: 'subscription_update',
      tier,
      provider: provider || 'manual',
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true, message: `Subscribed to ${tier} successfully` })
  } catch (error: any) {
    console.error('Subscription error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

const port = process.env.PORT || 3005
app.listen(port, () => {
  console.log(`Vellum Monetization Engine listening on port ${port}`)
})
