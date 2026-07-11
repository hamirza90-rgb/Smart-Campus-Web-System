// SIRF DEKHNE WALI SCRIPT — kuch bhi change nahi karti
// Run: node scripts/viewAttendance.js

require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected\n');

    const allRecords = await Attendance.find().sort({ date: -1, rollNo: 1 });

    console.log('========================================');
    console.log(`📋 TOTAL ATTENDANCE RECORDS: ${allRecords.length}`);
    console.log('========================================\n');

    allRecords.forEach((r, i) => {
      console.log(`${i + 1}. Student: ${r.studentName} (Roll: ${r.rollNo})`);
      console.log(`   Class: ${r.class} | Subject: ${r.subject || 'N/A'}`);
      console.log(`   Date: ${r.date} | Status: ${r.status} | Mode: ${r.mode}`);
      console.log('   ----------------------------------------');
    });

    // Per-student summary
    console.log('\n========================================');
    console.log('📊 PER-STUDENT SUMMARY');
    console.log('========================================\n');

    const rollNos = [...new Set(allRecords.map(r => r.rollNo))];
    rollNos.forEach(roll => {
      const records = allRecords.filter(r => r.rollNo === roll);
      const present = records.filter(r => r.status === 'P').length;
      const absent = records.filter(r => r.status === 'A').length;
      const leave = records.filter(r => r.status === 'L').length;
      const pct = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
      console.log(`Roll: ${roll} | Total Records: ${records.length} | Present: ${present} | Absent: ${absent} | Leave: ${leave} | Attendance %: ${pct}%`);
    });

    console.log('\n✅ Done — kuch bhi change nahi hua.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();