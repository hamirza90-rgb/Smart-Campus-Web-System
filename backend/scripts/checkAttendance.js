// checkAttendance.js
// Backend folder ke andar rakhein: backend/scripts/checkAttendance.js
// Chalayein: node scripts/checkAttendance.js
require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Database connected\n');

  const records = await Attendance.find().sort({ createdAt: -1 }).limit(30);

  console.log('='.repeat(60));
  console.log(`📋 LATEST ${records.length} ATTENDANCE RECORDS`);
  console.log('='.repeat(60));

  records.forEach((r, i) => {
    console.log(`\n${i + 1}. Student: ${r.studentName} (Roll: ${r.rollNo})`);
    console.log(`   Class: "${r.class}"`);
    console.log(`   Subject: "${r.subject}"`);
    console.log(`   Status: ${r.status}`);
    console.log(`   Date: ${r.date}`);
    console.log(`   Mode: ${r.mode}`);
    console.log('-'.repeat(50));
  });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});