const express = require("express");
const cors = require("cors");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: false }));
app.use(express.json());

const APP_ID  = process.env.AGORA_APP_ID || "";
const APP_CERT= process.env.AGORA_APP_CERTIFICATE || "";
function expInMinutes(min = 5) {
  return Math.floor(Date.now() / 1000) + min * 60;
}

// Matches what wsdk calls when ENABLE_TOKEN_AUTH=true
app.get("/api/agora/v1/user/details", (req, res) => {
  return res.json({ success: true, data: { id: "DEV_CLUB_UID_123", email: "dev@club.test" } });
});

app.post("/api/agora/v1/rtc/token", (req, res) => {
  try {
    const { channel, uid, role } = req.body || {};
    if (!channel || !uid) return res.status(400).json({ success:false, error:"channel+uid required" });

    const rtcRole = (role === "host") ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expire  = expInMinutes(5);

    // build token with *string* uid (maps to client.join(appId, ch, token, uid))
    const rtcToken = RtcTokenBuilder.buildTokenWithAccount(
      APP_ID, APP_CERT, channel, String(uid), rtcRole, expire
    );

    return res.json({ success:true, data: { appId: APP_ID, rtcToken, expireAt: expire } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:"token_failed" });
  }
});

app.listen(process.env.PORT || 4000, () =>
  console.log("Mini token server on http://localhost:4000")
);