import React, { JSX, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { GrooveTag } from '..';

interface FetchGroovesProps {
  userId: string;
  children: (grooveTags: GrooveTag[]) => JSX.Element;
}

export default function FetchGrooves({ userId, children }: FetchGroovesProps) {
  const [grooveTags, setGrooveTags] = useState<GrooveTag[]>([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (!userId) return;

    const fetchGrooves = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await axios.get(`${BASE_URL}/api/grooves`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedGrooves: GrooveTag[] = res.data.grooves.map((g: any) => ({
          id: g.id,
          coordinates: g.coordinates,
          vibe: g.vibe,
          message: g.message,
          taggedAt: new Date(g.createdAt._seconds * 1000),
          location: g.location || 'Unknown',
          startTime: new Date(g.startAt._seconds * 1000),
          endTime: new Date(g.expiresAt._seconds * 1000),
          supportCount: g.supporters?.length || 0,
          userId: g.userId,
          chatId: g.chatId || null,
        }));

        setGrooveTags(formattedGrooves);
      } catch (err) {
        console.error('Error fetching grooves:', err);
        Toast.show({ type: 'error', text1: 'Failed to load grooves' });
      } finally {
        setLoading(false);
      }
    };

    fetchGrooves();
    const interval = setInterval(fetchGrooves, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return children(grooveTags);
}
