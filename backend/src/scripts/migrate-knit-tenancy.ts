import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Institution } from '../models/institution.model.js';
import { Course, Branch, Subject } from '../models/academic.model.js';
import { FacultyProfile, StudentProfile } from '../models/profiles.model.js';
import { FeedbackSession, Question, FeedbackResponse, SubmissionStatus, ActiveSubmissionToken } from '../models/feedback.model.js';
import { FacultySubjectMapping } from '../models/mapping.model.js';
import { RollMapping } from '../models/rollMapping.model.js';
import { SystemSettings } from '../models/settings.model.js';
import { User } from '../models/user.model.js';

async function migrate() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Find KNIT institution
  let knit = await Institution.findOne({ slug: 'knit' });
  if (!knit) {
    knit = await Institution.findOne({ institutionId: 'INS-2026-0001' });
  }

  if (!knit) {
    console.error('KNIT institution not found in database!');
    await mongoose.connection.close();
    return;
  }

  const knitId = knit._id;
  console.log(`Tagging all un-scoped / legacy KNIT master data with institutionId: ${knitId} (${knit.name})`);

  const coursesRes = await Course.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Courses updated: ${coursesRes.modifiedCount}`);

  const branchRes = await Branch.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Branches updated: ${branchRes.modifiedCount}`);

  const subjRes = await Subject.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Subjects updated: ${subjRes.modifiedCount}`);

  const facRes = await FacultyProfile.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Faculty updated: ${facRes.modifiedCount}`);

  const mapRes = await FacultySubjectMapping.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Faculty Mappings updated: ${mapRes.modifiedCount}`);

  const rollRes = await RollMapping.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Roll Mappings updated: ${rollRes.modifiedCount}`);

  const sessionRes = await FeedbackSession.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Feedback Sessions updated: ${sessionRes.modifiedCount}`);

  const qRes = await Question.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Questions updated: ${qRes.modifiedCount}`);

  const settingsRes = await SystemSettings.updateMany(
    { institutionId: { $in: [null, undefined] } },
    { $set: { institutionId: knitId } }
  );
  console.log(`Settings updated: ${settingsRes.modifiedCount}`);

  const userRes = await User.updateMany(
    {
      institutionId: { $in: [null, undefined] },
      role: { $in: ['admin', 'faculty', 'hod', 'dean', 'student'] },
      username: { $not: { $regex: /platform\.admin/i } }
    },
    { $set: { institutionId: knitId } }
  );
  console.log(`Users updated: ${userRes.modifiedCount}`);

  console.log('✅ Tenancy isolation migration completed successfully!');
  await mongoose.connection.close();
}

migrate().catch(console.error);
