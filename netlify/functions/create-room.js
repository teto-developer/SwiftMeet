const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

exports.handler = async (event) => {
  try {
    const { room, role } = JSON.parse(event.body);

    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;

    if (!room) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Room required" })
      };
    }

    const uid = Math.floor(Math.random() * 100000);
    const expireTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    const rtcRole =
      role === "host"
        ? RtcRole.PUBLISHER
        : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      room,
      uid,
      rtcRole,
      privilegeExpireTime
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ token, uid })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
