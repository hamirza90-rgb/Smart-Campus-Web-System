// SIRF DEKHNE WALI SCRIPT — kuch bhi change nahi karti
// Run: node scripts/checkAdminRole.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected\n');

    const allUsers = await User.find();

    console.log('========================================');
    console.log(`👤 TOTAL USERS (in User collection): ${allUsers.length}`);
    console.log('========================================\n');

    if (allUsers.length === 0) {
      console.log('⚠️ Koi bhi user nahi mila User collection mein!');
    } else {
      allUsers.forEach(u => {
        console.log(`Name: ${u.name} | Email: ${u.email} | role: "${u.role}" | _id: ${u._id}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();