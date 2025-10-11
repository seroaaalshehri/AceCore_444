const { RtcRole, RtcTokenBuilder } = require("agora-access-token");
const { AGORA_APP_ID, AGORA_APP_CERTIFICATE, TOKEN_TTL_MINUTES } = require("./config/agoraConfig");

const expAt = (mins = TOKEN_TTL_MINUTES) => Math.floor(Date.now()/1000) + mins*60;

function buildRtcToken({ channel, uid, role }) {
  const rtcRole = role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const expireAt = expAt();
  const rtcToken = RtcTokenBuilder.buildTokenWithAccount(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channel,
    String(uid),
    rtcRole,
    expireAt
  );
  return { rtcToken, expireAt, appId: AGORA_APP_ID };
}

module.exports = { buildRtcToken };
