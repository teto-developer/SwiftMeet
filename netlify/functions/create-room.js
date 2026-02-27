const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        .replace(/\\n/g, "\n")   // ← これ超重要
        .replace(/\n/g, "\n")     // 念のため
    })
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

    const uid = Math.floor(Math.random() * 100000);

    const currentTime = Math.floor(Date.now() / 1000);
    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERT,
      room,
      uid,
      RtcRole.PUBLISHER,
      currentTime + 3600
    );

    await db.collection("rooms").doc(room).set({
      roomKey: password,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

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
