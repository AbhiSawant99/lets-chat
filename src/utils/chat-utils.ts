export const getRoomId = (senderId: string, receiverId: string) => {
  const roomids = [senderId, receiverId].sort();
  return `room_${roomids[0]}_${roomids[1]}`;
};
