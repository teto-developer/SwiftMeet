const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const admin = require("firebase-admin");

// Firebase初期化（重複防止）
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

    const { room } = JSON.parse(event.body);

    if (!room) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Room required" }),
      };
    }

    // 🔑 ランダムルームキー生成
    const roomKey = Math.random().toString(36).substring(2, 8);

    // 🔥 Firestoreに保存
    await db.collection("rooms").doc(room).set({
      roomKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🎥 Agoraトークン生成（ホスト用）
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
      RtcRole.PUBLISHER,
      privilegeExpireTime
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        room,
        roomKey,
        token,
        uid,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
