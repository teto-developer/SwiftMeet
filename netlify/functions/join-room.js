const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {

    const { room, password } = JSON.parse(event.body);

    const doc = await db.collection("rooms").doc(room).get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Room not found" })
      };
    }

    const data = doc.data();

    if (data.roomKey !== password) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Wrong password" })
      };
    }

    const uid = Math.floor(Math.random() * 100000);

    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERT,
      room,
      uid,
      RtcRole.SUBSCRIBER,
      Math.floor(Date.now() / 1000) + 3600
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
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
