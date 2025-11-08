import mongoose from 'mongoose';


const ReadingSchema = new mongoose.Schema({
payload: { type: Object, required: true },
leafHash: { type: String, required: true },
ts: { type: Date, required: true, index: true },
dayKey: { type: String, index: true },
farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
deviceId: { type: String, index: true }
}, { timestamps: true });


export default mongoose.model('Reading', ReadingSchema);