import mongoose from 'mongoose';


const DeviceSchema = new mongoose.Schema({
deviceId: { type: String, required: true, unique: true, index: true },
farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
label: { type: String },
meta: { type: Object }
}, { timestamps: true });


export default mongoose.model('Device', DeviceSchema);