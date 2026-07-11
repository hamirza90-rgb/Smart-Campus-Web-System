// DELETE SCRIPT — sirf orphaned attendance records delete karta hai
// (jinka rollNo kisi bhi current Student se match nahi karta)
// Real students ka koi record touch nahi hoga
// Run: node scripts/deleteOrphanedAttendance.js

require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected\n');

    const allStudents = await Student.find();
    const validRolls = allStudents.map(s => s.roll);

    console.log(`✅ Valid roll numbers (will be kept): ${validRolls.join(', ')}\n`);

    const result = await Attendance.deleteMany({
      rollNo: { $nin: validRolls }
    });

    console.log('========================================');
    console.log(`🗑️ DELETED ${result.deletedCount} orphaned attendance record(s)`);
    console.log('========================================\n');
    console.log('✅ Sab real students (' + validRolls.join(', ') + ') ka data safe hai, touch nahi hua.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();