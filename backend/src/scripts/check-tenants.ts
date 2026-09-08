import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Institution } from '../models/institution.model.js';
import { User } from '../models/user.model.js';
import { Course, Branch, Subject } from '../models/academic.model.js';
import { FacultyProfile } from '../models/profiles.model.js';
import { FeedbackSession } from '../models/feedback.model.js';

async function check() {
  await mongoose.connect(env.MONGO_URI);
  const recBanda = await Institution.findOne({ slug: 'recbanda' });
  console.log('REC Banda Institution:');
  console.log({
    _id: recBanda?._id,
    institutionId: recBanda?.institutionId,
    name: recBanda?.name,
    slug: recBanda?.slug,
    adminUserId: recBanda?.adminUserId
  });
  if (recBanda?.adminUserId) {
    const adminUser = await User.findById(recBanda.adminUserId);
    console.log('REC Banda Admin User:', {
      _id: adminUser?._id,
      username: adminUser?.username,
      role: adminUser?.role,
      institutionId: adminUser?.institutionId
    });
  }

  const knit = await Institution.findOne({ slug: 'knit' });
  console.log('\nKNIT Institution:');
  console.log({
    _id: knit?._id,
    institutionId: knit?.institutionId,
    name: knit?.name,
    slug: knit?.slug,
    adminUserId: knit?.adminUserId
  });

  await mongoose.connection.close();
}

check().catch(console.error);
