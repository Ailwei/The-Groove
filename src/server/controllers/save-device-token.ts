import { Request, Response } from 'express';
import { db } from '../firebase/firestore';

export const saveTokenController = async (req: Request, res: Response) => {
  const { userId, deviceToken } = req.body;
  if (!userId || !deviceToken) return res.status(400).send('Missing fields');

  try {
    await db.collection('users').doc(userId).update({
      deviceToken,
    });
    res.send('Device token saved!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving token');
  }
};


