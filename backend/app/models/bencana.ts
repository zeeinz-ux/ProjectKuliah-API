import mongoose from '#config/mongo'

const BencanaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true },
    date: { type: Date, required: true },
    maxVolunteers: { type: Number, required: true },
    photo: { type: String, required: false },
  },
  {
    timestamps: true,
  }
)
const Bencana = mongoose.model('Bencana', BencanaSchema)
export default Bencana //pakai 'export default' untuk model tunggal, dan 'export' untuk banyak ekspor.
