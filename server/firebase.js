const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let db;
let isMock = false;

// Check if the serviceAccountKey.json exists in the server directory
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (fs.existsSync(serviceAccountPath)) {
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
  console.warn("WARNING: serviceAccountKey.json not found in 'server/' folder.");
  console.warn("Express server will use a local mock-db.json fallback.");
  console.warn("To use real Google Firebase, place your serviceAccountKey.json in the 'server/' directory.");
  console.warn("=======================================================\n");
  useMockDb();
}

function useMockDb() {
  isMock = true;
  const mockDbPath = path.join(__dirname, "mock-db.json");
  
  const readData = () => {
    if (!fs.existsSync(mockDbPath)) {
      return { users: [], hubs: [], records: [] };
    }
    try {
      return JSON.parse(fs.readFileSync(mockDbPath, "utf-8"));
    } catch (e) {
      return { users: [], hubs: [], records: [] };
    }
  };
  
  const writeData = (data) => {
    fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), "utf-8");
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
