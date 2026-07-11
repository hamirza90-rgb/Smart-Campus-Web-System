// SIRF DEKHNE WALI SCRIPT — kuch bhi change/delete nahi karti, bas data dikhati hai
// Run: node scripts/viewAllCourses.js

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected\n');

    const allCourses = await Course.find();
    const allTeachers = await Teacher.find();

    console.log('========================================');
    console.log(`📚 TOTAL COURSES: ${allCourses.length}`);
    console.log('========================================\n');

    allCourses.forEach((c, i) => {
      console.log(`${i + 1}. Course Name: ${c.name}`);
      console.log(`   Class: ${c.class}`);
      console.log(`   Teacher (name saved): ${c.teacher || '❌ NOT SET'}`);
      console.log(`   TeacherId (ObjectId link): ${c.teacherId || '❌ NOT SET'}`);
      console.log(`   Course Mongo _id: ${c._id}`);
      console.log('   ----------------------------------------');
    });

    console.log('\n========================================');
    console.log(`👩‍🏫 TOTAL TEACHERS: ${allTeachers.length}`);
    console.log('========================================\n');

    allTeachers.forEach((t, i) => {
      console.log(`${i + 1}. Name: ${t.name} | Email: ${t.email} | _id: ${t._id}`);
    });

    console.log('\n✅ Done — kuch bhi change nahi hua, sirf dikhaya gaya hai.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();