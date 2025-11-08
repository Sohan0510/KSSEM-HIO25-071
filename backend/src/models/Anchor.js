import mongoose from 'mongoose';


const SignatureSchema = new mongoose.Schema({
witnessUrl: String,
publicKey: String,
signature: String
}, { _id: false });


const AnchorSchema = new mongoose.Schema({
dayKey: { type: String, unique: true, index: true },
merkleRoot: { type: String, required: true },
signatures: [SignatureSchema],
quorumMet: { type: Boolean, default: false },
tampered: { type: Boolean, default: false },
tamperInfo: { type: Object }
}, { timestamps: true });


export default mongoose.model('Anchor', AnchorSchema);