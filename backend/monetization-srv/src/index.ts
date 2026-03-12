import express, { Request, Response } from 'express'
import cors from 'cors'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()
const app = express()

app.use(express.json())
app.use(cors())

// Phase M1 - Essence Coins & Tips
app.post('/api/payments/coins/purchase', async (req: Request, res: Response) => {
  const { userId, amount, provider } = req.body

  if (!userId || !amount) {
    return res.status(400).json({ ok: false, error: 'Missing userId or amount' })
  }

  try {
    const userRef = db.collection('users').doc(userId)

    await userRef.set({
      essenceBalance: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true })

    // Log transaction
    await db.collection('transactions').add({
      userId,
      type: 'purchase',
      amount,
      provider,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ ok: true, message: 'Coins purchased successfully' })
  } catch (error: any) {
    console.error('Purchase error:', error)
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
    await db.runTransaction(async (t) => {
      const userRef = db.collection('users').doc(userId)
      const creatorRef = db.collection('users').doc(creatorId)

      const userSnap = await t.get(userRef)
      const userBalance = userSnap.data()?.essenceBalance || 0

      if (userBalance < amount) {
        throw new Error('Insufficient Essence')
      }

      // Deduct from user
      t.set(userRef, {
        essenceBalance: admin.firestore.FieldValue.increment(-amount),
        lifetimeSpent: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })

      // Add to creator
      t.set(creatorRef, {
        essenceBalance: admin.firestore.FieldValue.increment(amount),
        lifetimeEarned: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })

      // Record transaction
      const transRef = db.collection('transactions').doc()
      t.set(transRef, {
        id: transRef.id,
        fromId: userId,
        fromName: username || 'Anonymous',
        toId: creatorId,
        type: 'tip',
        amount,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    })

    res.json({ ok: true, message: 'Tip sent successfully' })
  } catch (error: any) {
    console.error('Tip error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Phase M2 - Subscriptions (Placeholder)
app.post('/api/payments/subscription', (req: Request, res: Response) => {
  res.json({ ok: true, message: 'Subscription placeholder', data: req.body })
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Vellum Monetization Engine listening on port ${port}`)
})
