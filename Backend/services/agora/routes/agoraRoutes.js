const express = require('express');
const { RtcRole, RtcTokenBuilder, RtmTokenBuilder } = require('agora-access-token');

const router = express.Router();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERT;

// tiny helper to fail fast if misconfigured
function assertAgoraEnv() {
  if (!APP_ID || !APP_CERT) {
    const e = new Error('AGORA_APP_ID / AGORA_APP_CERTIFICATE missing');
    e.status = 500;
    throw e;
  }
}

/**
 * POST /api/agora/token
 * body: { channel: string, uid?: string|number, role?: "host"|"audience", expireSeconds?: number }
 * returns: { success, appId, channel, uid, role, rtcToken, rtmToken, expireAt }
 */
router.post('/token', async (req, res) => {
  try {
    assertAgoraEnv();

    const { channel } = req.body || {};
    let { uid, role = 'host', expireSeconds = 2 * 60 * 60 } = req.body || {}; // default 2h

    if (!channel) return res.status(400).json({ success: false, error: 'channel required' });

    // use numeric uid if possible; fall back to string uid
    let numericUid = 0;
    let useNumeric = false;
    if (uid !== undefined && uid !== null && uid !== '') {
      const n = Number(uid);
      if (!Number.isNaN(n) && Number.isInteger(n) && n >= 0) {
        numericUid = n;
        useNumeric = true;
      } else {
        // keep string uid in uidStr
        useNumeric = false;
      }
    } else {
      // generate a small random uid if none provided
      numericUid = Math.floor(Math.random() * 2_000_000_000);
      uid = String(numericUid);
      useNumeric = true;
    }

    const agoraRole = role === 'audience' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const now = Math.floor(Date.now() / 1000);
    const expireAt = now + Number(expireSeconds || 0);

    let rtcToken;
    if (useNumeric) {
      rtcToken = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERT,
        channel,
        numericUid,
        agoraRole,
        expireAt
      );
    } else {
      rtcToken = RtcTokenBuilder.buildTokenWithAccount(
        APP_ID,
        APP_CERT,
        channel,
        String(uid),
        agoraRole,
        expireAt
      );
    }

    // RTM token uses the same “account” (string) identity
    const rtmToken = RtmTokenBuilder.buildToken(APP_ID, APP_CERT, String(uid), expireAt);

    return res.json({
      success: true,
      appId: APP_ID,
      channel,
      uid,                // echo back the uid you should pass to App Builder
      role: agoraRole === RtcRole.PUBLISHER ? 'host' : 'audience',
      rtcToken,
      rtmToken,
      expireAt,           // unix seconds
    });
  } catch (e) {
    console.error('agora/token error', e);
    const status = e.status || 500;
    return res.status(status).json({ success: false, error: e.message || 'Internal error' });
  }
});

module.exports = router;
