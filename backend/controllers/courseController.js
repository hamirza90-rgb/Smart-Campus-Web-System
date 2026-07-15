const Course = require('../models/Course');
const Teacher = require('../models/Teacher');

// TEACHER: get ONLY their own courses (used by Teacher Dashboard)
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacherId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUBLIC/STUDENT/ADMIN: get all courses, optionally filtered by ?class=XYZ
exports.getAllCourses = async (req, res) => {
  try {
    const Chapter = require('../models/Chapter');
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    const courses = await Course.find(filter).sort({ createdAt: -1 });
    const coursesWithProgress = await Promise.all(courses.map(async (course) => {
      const allChapters = await Chapter.find({ course: course._id });
      const completedChapters = allChapters.filter(c => c.status === 'Completed').length;
      return {
        ...course.toObject(),
        chapDone: completedChapters,
        chapters: course.chapters || 0
      };
    }));
    res.status(200).json(coursesWithProgress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// TEACHER: add course — teacherId ALWAYS comes from JWT, never from client body
exports.addCourse = async (req, res) => {
  try {
    const { name, class: className, chapters, status, teacherId } = req.body;
    if (!name || !className) {
      return res.status(400).json({ message: 'Course name and class are required' });
    }

    // Agar Teacher khud add kar raha hai -> apna hi ID use hoga
    // Agar Admin add kar raha hai -> body se aaya hua teacherId use hoga (dropdown se select kiya hua)
    const finalTeacherId = req.user.role === 'teacher' ? req.user.id : (teacherId || null);

    let teacherName = '';
    if (finalTeacherId) {
      const teacherDoc = await Teacher.findById(finalTeacherId);
      teacherName = teacherDoc ? teacherDoc.name : '';
    }

    const course = await Course.create({
      name,
      class: className,
      chapters: chapters || 0,
      status: status || 'Active',
      teacherId: finalTeacherId,
      teacher: teacherName
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// TEACHER: update — only if they own the course
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { name, class: className, chapters, status, chapDone, teacherId } = req.body;

    const updateData = { name, class: className, chapters, status, chapDone };

    // Agar teacher change kiya gaya hai, to teacherId aur teacher naam dono update karein
    if (teacherId) {
      const Teacher = require('../models/Teacher');
      const teacherDoc = await Teacher.findById(teacherId);
      updateData.teacherId = teacherId;
      updateData.teacher = teacherDoc ? teacherDoc.name : '';
    }

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// TEACHER: delete — only if they own the course
exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};