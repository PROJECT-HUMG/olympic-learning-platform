/** Keep each member at the same desk across polling, reconnects and ownership changes. */
export function reconcileSceneSeats(previous: readonly (string | null)[], memberIds: readonly string[]) {
  const members = new Set(memberIds);
  const placed = new Set<string>();
  const seats = previous.map((id) => {
    if (!id || !members.has(id) || placed.has(id)) return null;
    placed.add(id);
    return id;
  });
  for (const id of members) {
    if (placed.has(id)) continue;
    const empty = seats.indexOf(null);
    if (empty < 0) seats.push(id);
    else seats[empty] = id;
    placed.add(id);
  }
  while (seats.length < 4) seats.push(null);
  return seats;
}

export function memberInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(-2).map((word) => Array.from(word)[0]).join("").toLocaleUpperCase("vi") || "?";
}

export function memberLook(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return { color: hash % 5, hair: Math.floor(hash / 5) % 3, delay: -(hash % 40) / 10 };
}
