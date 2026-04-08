import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('Connected to DB');

  const result = await mongoose.connection.collection('customers').updateMany(
    { customerBalance: { $exists: false } },
    { $set: { customerBalance: 0 } }
  );

  console.log(`Updated ${result.modifiedCount} customers with customerBalance: 0`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
