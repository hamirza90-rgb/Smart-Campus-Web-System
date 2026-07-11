// One-time migration script — existing courses ka teacherId field fix karta hai
// Run: node scripts/fixCourseTeacherId.js  (backend folder ke andar se)

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected');

    // Un courses ko dhoondo jinka teacherId set nahi hai
    const coursesWithoutTeacherId = await Course.find({
      $or: [{ teacherId: null }, { teacherId: { $exists: false } }]
    });

    console.log(`\n🔍 ${coursesWithoutTeacherId.length} course(s) mile jinka teacherId missing hai.\n`);

    let fixed = 0;
    const unmatched = [];

    for (const course of coursesWithoutTeacherId) {
      if (!course.teacher) {
        unmatched.push({ id: course._id, name: course.name, class: course.class, reason: 'No teacher name saved on this course' });
        continue;
      }

      // Teacher ka naam match karo (case-insensitive)
      const matchedTeacher = await Teacher.findOne({
        name: { $regex: new RegExp(`^${course.teacher.trim()}$`, 'i') }
      });

      if (matchedTeacher) {
        course.teacherId = matchedTeacher._id;
        await course.save();
        fixed++;
        console.log(`✅ Fixed: "${course.name}" (${course.class}) → linked to teacher "${matchedTeacher.name}"`);
      } else {
        unmatched.push({ id: course._id, name: course.name, class: course.class, teacherNameSaved: course.teacher });
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`⚠️ Unmatched (manual fix needed): ${unmatched.length}`);

    if (unmatched.length > 0) {
      console.log('\nYe courses manually check karne honge:');
      unmatched.forEach(u => console.log(`  - Course: "${u.name}" | Class: ${u.class} | Saved teacher name: "${u.teacherNameSaved || 'N/A'}" | ID: ${u.id}`));
      console.log('\nInhe fix karne ke liye: MongoDB Compass kholein → Course collection → is document ka teacherId field manually us teacher ki _id se set kar den (Teacher collection se copy karke).');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

run();