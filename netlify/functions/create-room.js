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

    const { room, password } = JSON.parse(event.body);

    if (!room || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Room and password required" })
      };
    }

    const roomKey = password; // ← ここがパスワード

    // Firestore保存
    await db.collection("rooms").doc(room).set({
      roomKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Agora token
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;

    const uid = Math.floor(Math.random() * 100000);
    const expireTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      room,
      uid,
      RtcRole.PUBLISHER,
      currentTime + expireTime
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        room,
        token,
        uid
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
