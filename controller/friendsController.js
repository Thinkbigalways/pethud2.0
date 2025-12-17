/**
 * Friends controller (stub).
 * Endpoints return success so the UI can behave without full backend logic.
 */

async function sendRequest(req, res) {
  return res.json({ success: true });
}

async function acceptRequest(req, res) {
  return res.json({ success: true });
}

async function cancelRequest(req, res) {
  return res.json({ success: true });
}

async function removeFriend(req, res) {
  return res.json({ success: true });
}

async function listFriends(req, res) {
  return res.json({ success: true, friends: [] });
}

async function pendingRequests(req, res) {
  return res.json({ success: true, requests: [] });
}

module.exports = {
  sendRequest,
  acceptRequest,
  cancelRequest,
  removeFriend,
  listFriends,
  pendingRequests,
};


