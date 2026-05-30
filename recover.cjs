const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { initializeFirestore, getDoc, doc } = require('firebase/firestore');

// Read Firebase configurations
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8')
);

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId || undefined);

const filesToRestore = [
  "00f846ed-5c27-45f7-bd75-24dbbdfadc9d.png",
  "d2907fe2-f05f-4f50-8c36-488e39025258_secure_compat.mp4",
  "045f9ecc-148a-4707-bcc8-67077c9c603e.png",
  "06b33a03-d49a-4e60-a6f2-f87e1c9f699d_secure_compat.mp4"
];

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function restoreFile(filename) {
  const targetPath = path.join(UPLOADS_DIR, filename);
  console.log(`[RECOVERY] Starting restoration for ${filename}...`);
  try {
    const metaDoc = await getDoc(doc(db, 'system_files', filename));
    if (!metaDoc.exists()) {
      console.warn(`[RECOVERY] No metadata found in Firestore for ${filename}`);
      return false;
    }
    
    const meta = metaDoc.data();
    const totalChunks = meta.totalChunks || 0;
    
    if (totalChunks === 0) {
      console.warn(`[RECOVERY] File metadata has 0 chunks for ${filename}`);
      return false;
    }
    
    console.log(`[RECOVERY] Found total chunks to fetch: ${totalChunks}`);
    const chunkBuffers = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'system_files', filename, 'chunks', String(i)));
      if (!chunkDoc.exists()) {
        console.error(`[RECOVERY] Missing chunk ${i} for ${filename}`);
        return false;
      }
      const chunkData = chunkDoc.data();
      if (!chunkData || !chunkData.data) {
        console.error(`[RECOVERY] Empty data at chunk ${i} for ${filename}`);
        return false;
      }
      chunkBuffers.push(Buffer.from(chunkData.data, 'base64'));
      if (i % 10 === 0 || i === totalChunks - 1) {
        console.log(`[RECOVERY]  Progress: ${i + 1}/${totalChunks} chunks downloaded...`);
      }
    }
    
    const fileBuffer = Buffer.concat(chunkBuffers);
    fs.writeFileSync(targetPath, fileBuffer);
    console.log(`[RECOVERY] SUCCESS! ${filename} restored and saved to disk. Type: ${meta.mimeType || 'unknown'} (${fileBuffer.length} bytes)\n`);
    return true;
  } catch (err) {
    console.error(`[RECOVERY] ERROR during restoration of ${filename}:`, err);
    return false;
  }
}

async function run() {
  console.log('[RECOVERY ENGINE] Starting active recovery scan for the main product media files...');
  for (const filename of filesToRestore) {
    await restoreFile(filename);
  }
  console.log('[RECOVERY ENGINE] Finished scan.');
  process.exit(0);
}

run();
