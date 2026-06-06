const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let db;
let isMock = false;

// Check if the serviceAccountKey.json exists in the server directory
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    db = admin.firestore();
    console.log("Successfully connected to Google Firebase Firestore via Environment Variables.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK via Env Vars:", error);
    useMockDb();
  }
} else if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Successfully connected to Google Firebase Firestore.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    useMockDb();
  }
} else {
  console.warn("\n=======================================================");
  console.warn("WARNING: Firebase credentials not provided.");
  console.warn("Express server will use a local mock-db.json fallback.");
  console.warn("=======================================================\n");
  useMockDb();
}

function useMockDb() {
  isMock = true;
  const originalDbPath = path.join(__dirname, "mock-db.json");
  const isVercel = !!process.env.VERCEL;
  const mockDbPath = isVercel ? "/tmp/mock-db.json" : originalDbPath;

  // Copy seed database to /tmp if it does not exist on Vercel
  if (isVercel && !fs.existsSync(mockDbPath) && fs.existsSync(originalDbPath)) {
    try {
      fs.copyFileSync(originalDbPath, mockDbPath);
      console.log("Copied seed mock-db.json to writeable /tmp/mock-db.json");
    } catch (err) {
      console.error("Failed to copy seed database to /tmp:", err);
    }
  }
  
  const readData = () => {
    if (!fs.existsSync(mockDbPath)) {
      if (fs.existsSync(originalDbPath)) {
        try {
          return JSON.parse(fs.readFileSync(originalDbPath, "utf-8"));
        } catch (e) {}
      }
      return { users: [], hubs: [], records: [] };
    }
    try {
      return JSON.parse(fs.readFileSync(mockDbPath, "utf-8"));
    } catch (e) {
      return { users: [], hubs: [], records: [] };
    }
  };
  
  const writeData = (data) => {
    try {
      fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write mock database:", e);
    }
  };

  db = {
    collection: (colName) => {
      return {
        get: async () => {
          const data = readData();
          const list = data[colName] || [];
          const docs = list.map(item => ({
            id: item.id,
            data: () => item
          }));
          return {
            empty: list.length === 0,
            docs,
            forEach: (callback) => docs.forEach(callback)
          };
        },
        doc: (docId) => {
          return {
            get: async () => {
              const data = readData();
              const list = data[colName] || [];
              const item = list.find(x => x.id === docId);
              return {
                exists: !!item,
                data: () => item
              };
            },
            set: async (docData, options) => {
              const data = readData();
              if (!data[colName]) data[colName] = [];
              const index = data[colName].findIndex(x => x.id === docId);
              
              let newItem = { ...docData, id: docId };
              if (index > -1) {
                if (options && options.merge) {
                  newItem = { ...data[colName][index], ...docData, id: docId };
                }
                data[colName][index] = newItem;
              } else {
                data[colName].push(newItem);
              }
              writeData(data);
              return true;
            },
            update: async (updateData) => {
              const data = readData();
              if (!data[colName]) return false;
              const index = data[colName].findIndex(x => x.id === docId);
              if (index > -1) {
                data[colName][index] = { ...data[colName][index], ...updateData };
                writeData(data);
                return true;
              }
              throw new Error(`Document not found: ${docId}`);
            }
          };
        },
        add: async (docData) => {
          const data = readData();
          if (!data[colName]) data[colName] = [];
          const newId = docData.id || `${colName.slice(0, -1)}-${Date.now()}`;
          const newItem = { ...docData, id: newId };
          data[colName].push(newItem);
          writeData(data);
          return {
            id: newId,
            get: async () => ({
              data: () => newItem
            })
          };
        }
      };
    }
  };
}

module.exports = { db, isMock };
