const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { room, roomKey } = JSON.parse(event.body);

    if (!room || !roomKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Room and key required" }),
      };
    }

    const doc = await db.collection("rooms").doc(room).get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Room not found" }),
      };
    }

    const data = doc.data();

    if (data.roomKey !== roomKey) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid room key" }),
      };
    }

    // 🎥 視聴者トークン発行
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;

    const uid = Math.floor(Math.random() * 100000);
    const expireTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      room,
      uid,
      RtcRole.SUBSCRIBER,
      privilegeExpireTime
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ token, uid }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
