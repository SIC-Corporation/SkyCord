// Check if user is staff (admin/mod) in the guild
function isStaff(member) {
  return (
    member.permissions.has('Administrator') ||
    member.permissions.has('ManageGuild') ||
    member.permissions.has('BanMembers') ||
    member.roles.cache.some(r => ['staff', 'mod', 'moderator', 'admin'].includes(r.name.toLowerCase()))
  );
}

// Check if user is the owner of a specific call
function isCallOwner(client, callId, userId) {
  const call = client.activeCalls.get(callId);
  if (!call) return false;
  return call.ownerId === userId;
}

// Check if user is a call admin (or owner)
function isCallAdmin(client, callId, userId) {
  const call = client.activeCalls.get(callId);
  if (!call) return false;
  return call.ownerId === userId || call.adminIds.has(userId);
}

// Find what call a user is currently in
function getUserCall(client, userId) {
  for (const [callId, call] of client.activeCalls) {
    if (call.members.has(userId)) return { callId, call };
  }
  return null;
}

module.exports = { isStaff, isCallOwner, isCallAdmin, getUserCall };
