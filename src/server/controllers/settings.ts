import { Request, Response } from 'express';
import { db } from '../firebase/firestore';

export const updateSettingsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { highAccuracy, notificationsEnabled, notificationFrequency } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const validFreq = ['all', 'groove','important', 'owner'] as const;
    if (notificationFrequency && !validFreq.includes(notificationFrequency)) {
      return res.status(400).json({ error: 'Invalid notification frequency' });
    }

    const userRef = db.collection('users').doc(userId);

    const updateData: any = {};
    if (highAccuracy !== undefined) updateData['settings.locationAccuracy'] = highAccuracy ? 'high' : 'low';
    if (notificationsEnabled !== undefined) updateData['settings.notificationsEnabled'] = notificationsEnabled;
    if (notificationFrequency) updateData['settings.notificationFrequency'] = notificationFrequency;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid settings provided to update' });
    }

    await userRef.update(updateData);

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
export const getSettingsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    const settings = {
      highAccuracy: userData?.settings?.locationAccuracy === 'high',
      notificationsEnabled: !!userData?.settings?.notificationsEnabled,
      notificationFrequency: userData?.settings?.notificationFrequency || 'all',
    };

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

