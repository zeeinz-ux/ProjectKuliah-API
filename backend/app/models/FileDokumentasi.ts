// backend/app/models/FileDokumentasi.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IFileDokumentasi extends Document {
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string // URL secure_url dari Cloudinary
  uploadedAt: Date
  projectId?: string // Hubungan ke ID proyek terkait
}

const FileSchema: Schema = new Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  projectId: { type: String }, // Optional: untuk relasi ke proyek
})

export default mongoose.model<IFileDokumentasi>('FileDokumentasi', FileSchema)
