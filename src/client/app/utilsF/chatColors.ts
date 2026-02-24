export const colors = [
  "#3b82f6",
  "#2563eb",
  "#6b7280",
  "#4b5563",
  "#9333ea",
  "#8b5cf6",
  "#a78bfa",
  "#10b981", 
  "#14b8a6", 
  "#f97316", 
  "#f59e0b", 
  "#facc15",
  "#eab308",
  "#f43f5e", 
  "#ec4899",
  "#be185d",
  "#7c3aed", 
];

export const getColorForUserInGroup = (userId: string, grooveId: string): string => {
  let hash = 0;
  const combined = userId + grooveId;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
