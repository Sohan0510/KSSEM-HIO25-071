import mongoose from 'mongoose';


const FarmerDayAuditSchema = new mongoose.Schema({
farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
dayKey: { type: String, index: true },
status: { type: String, enum: ['clean_purged', 'kept_tampered', 'pending_anchor', 'global_tamper'], index: true },
details: { type: Object }
}, { timestamps: true, indexes: [{ farmerId: 1, dayKey: 1, unique: true }] });


export default mongoose.model('FarmerDayAudit', FarmerDayAuditSchema);