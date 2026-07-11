// SIRF DEKHNE WALI SCRIPT — kuch bhi change/delete nahi karti
// Run: node scripts/viewAllStudents.js

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected\n');

    const allStudents = await Student.find().sort({ dept: 1, roll: 1 });

    console.log('========================================');
    console.log(`👨‍🎓 TOTAL STUDENTS: ${allStudents.length}`);
    console.log('========================================\n');

    // Group by class/dept
    const byDept = {};
    allStudents.forEach(s => {
      const dept = s.dept || 'NO CLASS';
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(s);
    });

    Object.keys(byDept).forEach(dept => {
      console.log(`\n📚 CLASS: ${dept} (${byDept[dept].length} students)`);
      console.log('----------------------------------------');
      byDept[dept].forEach(s => {
        console.log(`  Roll: ${s.roll} | Name: ${s.name} | Email: ${s.email} | _id: ${s._id}`);
      });
    });

    console.log('\n✅ Done — kuch bhi change/delete nahi hua, sirf dikhaya gaya hai.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();