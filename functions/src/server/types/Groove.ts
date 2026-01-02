export interface Groove {
  userId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  vibe: "very_busy" | "busy" | "mild" | "quiet";
  message?: string;
  createdAt: number;
  expiresAt: number;
}
