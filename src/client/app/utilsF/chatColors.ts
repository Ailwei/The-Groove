export const colors = [
  "#ee1228", "#0a92d5", "#FFFFBA", "#BAFFC9", "#BAE1FF",
  "#d112e7", "#FFB347", "#6bdcb3", "#C7CEEA", "#FDE2E4",
  "#be6378", "#3b08e5", "#D5F4E6", "#C1F0F6", "#070b01",
  "#ec9b11", "#386041", "#FFE5D9", "#C9C9FF", "#D8BFD8",
  "#31312d", "#0d0dd8", "#F5F5DC", "#F0FFF0", "#F0FFFF",
  "#f2f206", "#FFFACD", "#2f1b19", "#16c2c2", "#d69ad5",
  "#0cf00c", "#F5F5F5", "#FFF0F5", "#F0FFFF", "#F5FFFA",
  "#61391c", "#b47a06", "#063a10", "#F0FFF0", "#d95c19",
  "#d4d1c0", "#F0FFFF", "#E0FFFF", "#505488", "#FFFACD",
  "#575722", "#FFE4E1", "#d40d50", "#FFEFD5", "#ebd6b3"
];

export const getColorForUserInGroup = (userId: string, grooveId: string): string => {
  let hash = 0;
  const combined = userId + grooveId;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
