
module.exports = {
  AGORA_APP_ID: process.env.AGORA_APP_ID,
  AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERT,
  TOKEN_TTL_MINUTES: Number(process.env.TOKEN_TTL_MINUTES || 5), 
};

