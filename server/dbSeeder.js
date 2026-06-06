const { db } = require("./firebase");

async function seedDatabase() {
  try {
    const usersCol = db.collection("users");
    const hubsCol = db.collection("hubs");
    const recordsCol = db.collection("records");

    const usersSnap = await usersCol.get();
    if (usersSnap.empty) {
      console.log("Seeding users...");
      const MOCK_USERS = [
        { id: 'user-1', name: 'Admin User', username: 'admin', password: 'password', role: 'Admin', hubId: 'hub-0' },
        { id: 'user-2', name: 'Central Dairy Incharge', username: 'central.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-1' },
        { id: 'user-3', name: 'North Village Incharge', username: 'north.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-2' },
        { id: 'user-4', name: 'South Village Incharge', username: 'south.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-3' },
        { id: 'user-5', name: 'Metro Dairy Incharge', username: 'metro.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-4' },
        { id: 'user-6', name: 'East Town Incharge', username: 'east.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-5' },
      ];
      for (const u of MOCK_USERS) {
        await usersCol.doc(u.id).set(u);
      }
    }

    const hubsSnap = await hubsCol.get();
    if (hubsSnap.empty) {
      console.log("Seeding hubs...");
      const MOCK_HUBS = [
        { id: 'hub-0', name: 'Corporate HQ', parentId: null },
        { id: 'hub-1', name: 'Central Dairy', parentId: null },
        { id: 'hub-2', name: 'North Village Collection', parentId: 'hub-1' },
        { id: 'hub-3', name: 'South Village Collection', parentId: 'hub-1' },
        { id: 'hub-4', name: 'Metro Dairy', parentId: null },
        { id: 'hub-5', name: 'East Town Collection', parentId: 'hub-4' },
      ];
      for (const h of MOCK_HUBS) {
        await hubsCol.doc(h.id).set(h);
      }
    }

    const recordsSnap = await recordsCol.get();
    if (recordsSnap.empty) {
      console.log("Seeding daily records...");
      const hubsToGenerateFor = ['hub-1', 'hub-2', 'hub-3', 'hub-4', 'hub-5'];
      const today = new Date();
      
      for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        for (const hubId of hubsToGenerateFor) {
          const id = `record-${hubId}-${dateString}`;
          const record = {
            id,
            hubId,
            date: dateString,
            morning: {
              quantity: Math.round((500 + Math.random() * 200) * 10) / 10,
              fat: Math.round((3.5 + Math.random() * 0.5) * 10) / 10,
              snf: Math.round((8.5 + Math.random() * 0.3) * 10) / 10,
            },
            evening: {
              quantity: Math.round((450 + Math.random() * 150) * 10) / 10,
              fat: Math.round((3.8 + Math.random() * 0.4) * 10) / 10,
              snf: Math.round((8.6 + Math.random() * 0.2) * 10) / 10,
            },
          };
          await recordsCol.doc(id).set(record);
        }
      }
    }
    
    console.log("Database seed check completed.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

module.exports = { seedDatabase };
