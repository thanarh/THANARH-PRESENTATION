/**
 * One-time script: create a test visitor account in MongoDB.
 * Usage: node scripts/create-test-visitor.mjs
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌  MONGODB_URI not set'); process.exit(1); }

await mongoose.connect(MONGODB_URI, { dbName: 'thanarah_presentation' });

const userSchema = new mongoose.Schema({
  fullName:             String,
  email:                { type: String, unique: true, lowercase: true },
  passwordHash:         String,
  role:                 String,
  status:               String,
  permissions:          [String],
  allowedSections:      [String],
  preferredLanguage:    { type: String, default: 'ar' },
  emailVerified:        Boolean,
  failedLoginAttempts:  { type: Number, default: 0 },
  mfaEnabled:           { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

const EMAIL    = 'visitor@thanarah.test';
const PASSWORD = 'Visitor@2025';

const existing = await User.findOne({ email: EMAIL });
if (existing) {
  console.log('ℹ️  Account already exists — updating password…');
  existing.passwordHash = await bcrypt.hash(PASSWORD, 12);
  existing.status = 'active';
  await existing.save();
} else {
  await User.create({
    fullName:          'زائر تجريبي',
    email:             EMAIL,
    passwordHash:      await bcrypt.hash(PASSWORD, 12),
    role:              'viewer',
    status:            'active',
    emailVerified:     true,
    permissions:       [],
    allowedSections:   [],
    preferredLanguage: 'ar',
  });
}

console.log('\n✅  Test visitor account ready:\n');
console.log('   Email    :', EMAIL);
console.log('   Password :', PASSWORD);
console.log('   Role     : viewer\n');

await mongoose.disconnect();
