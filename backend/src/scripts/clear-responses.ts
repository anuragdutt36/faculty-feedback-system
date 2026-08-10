import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { FeedbackResponse, SubmissionStatus } from '../models/feedback.model';

const clearResponses = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    console.log('Clearing FeedbackResponse collection...');
    const responseResult = await FeedbackResponse.deleteMany({});
    console.log(`Deleted ${responseResult.deletedCount} responses.`);

    console.log('Clearing SubmissionStatus collection...');
    const submissionResult = await SubmissionStatus.deleteMany({});
    console.log(`Deleted ${submissionResult.deletedCount} submission statuses.`);

    console.log('Successfully cleared all responses!');
  } catch (error) {
    console.error('Error clearing responses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

clearResponses();
