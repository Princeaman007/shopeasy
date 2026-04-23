'use client';

import { useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function TrackVisite({ shopId }: { shopId: string }) {
  useEffect(() => {
    const track = async () => {
      try {
        await fetch(`${API}/analytics/track`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ shopId, source: 'direct' }),
        });
      } catch {
        // Silencieux
      }
    };
    track();
  }, [shopId]);

  return null; // Composant invisible
}