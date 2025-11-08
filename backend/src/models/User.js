import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const UserSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true, unique: true, index: true },
passwordHash: { type: String, required: true },
role: { type: String, enum: ['farmer', 'admin'], default: 'farmer', index: true }
}, { timestamps: true });


UserSchema.methods.setPassword = async function (pwd) {
const salt = await bcrypt.genSalt(10);
this.passwordHash = await bcrypt.hash(pwd, salt);
};


UserSchema.methods.comparePassword = async function (pwd) {
return bcrypt.compare(pwd, this.passwordHash);
};


export default mongoose.model('User', UserSchema);