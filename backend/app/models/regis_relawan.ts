import { mongoose } from '#config/mongo'

const RegisRelawanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bencana: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bencana',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
)

// 1 user tidak boleh daftar 2x di bencana yang sama
RegisRelawanSchema.index({ user: 1, bencana: 1 }, { unique: true })

const RegisRelawan = mongoose.model('RegisRelawan', RegisRelawanSchema)
export default RegisRelawan
