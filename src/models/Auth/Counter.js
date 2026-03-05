import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 1000 }
});

counterSchema.statics.getNextSequence = async function(sequenceName) {
  const counter = await this.findByIdAndUpdate( sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

export default mongoose.model('Counter', counterSchema);
