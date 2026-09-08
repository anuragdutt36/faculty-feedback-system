import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AcademicService } from '../services/academic.service.js';
import { ProfilesService } from '../services/profiles.service.js';
import { SessionsService } from '../services/sessions.service.js';
import { QuestionsService } from '../services/questions.service.js';
import { Institution } from '../models/institution.model.js';

async function test() {
  await mongoose.connect(env.MONGO_URI);

  const knit = await Institution.findOne({ slug: 'knit' });
  const banda = await Institution.findOne({ slug: 'recbanda' });

  console.log(`Testing KNIT (${knit?._id}) vs REC Banda (${banda?._id}):\n`);

  // 1. Courses
  const knitCourses = await AcademicService.getAllCourses(knit?._id);
  const bandaCourses = await AcademicService.getAllCourses(banda?._id);
  console.log(`KNIT Courses: ${knitCourses.length} | REC Banda Courses: ${bandaCourses.length}`);

  // 2. Branches
  const knitBranches = await AcademicService.getAllBranches(knit?._id);
  const bandaBranches = await AcademicService.getAllBranches(banda?._id);
  console.log(`KNIT Branches: ${knitBranches.length} | REC Banda Branches: ${bandaBranches.length}`);

  // 3. Faculty
  const knitFaculty = await ProfilesService.getAllFaculty(knit?._id);
  const bandaFaculty = await ProfilesService.getAllFaculty(banda?._id);
  console.log(`KNIT Faculty: ${knitFaculty.length} | REC Banda Faculty: ${bandaFaculty.length}`);

  // 4. Sessions
  const knitSessions = await SessionsService.getAllSessions(knit?._id?.toString());
  const bandaSessions = await SessionsService.getAllSessions(banda?._id?.toString());
  console.log(`KNIT Sessions: ${knitSessions.length} | REC Banda Sessions: ${bandaSessions.length}`);

  // 5. Questions
  const knitQuestions = await QuestionsService.getAllQuestions(knit?._id?.toString());
  const bandaQuestions = await QuestionsService.getAllQuestions(banda?._id?.toString());
  console.log(`KNIT Questions: ${knitQuestions.length} | REC Banda Questions: ${bandaQuestions.length}`);

  await mongoose.connection.close();
}

test().catch(console.error);
