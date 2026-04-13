import  mongoose  from '#config/mongo'

const CertificateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    provider: { type: String },
    dateIssued: { type: Date },
    dateExpired: { type: Date },
    certificateNumber: { type: String },
    category: { type: String },
    photo: { type: String },
  },
  { _id: true } // biar tiap sertifikat punya _id sendiri
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: '' },
    googleId: { type: String, default: '' },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    certificates: { type: [CertificateSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User// pakai 'export default' untuk model tunggal, dan 'export' untuk banyak ekspor.
