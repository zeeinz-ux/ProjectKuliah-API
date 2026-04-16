import type { HttpContext } from '@adonisjs/core/http'
import FileDokumentasi from '../models/FileDokumentasi.js'

export default class FileController {
  public async saveFileMetadata({ request, response }: HttpContext) {
    try {
      const { fileName, fileType, fileSize, fileUrl, projectId } = request.body()

      const newFile = new FileDokumentasi({
        fileName,
        fileType,
        fileSize,
        fileUrl,
        projectId,
      })

      const savedFile = await newFile.save()

      return response.status(201).json({
        message: 'Data file berhasil disimpan ke database',
        data: savedFile,
      })
    } catch (error) {
      console.error('Error saving file metadata:', error)

      return response.status(500).json({
        message: 'Gagal menyimpan data file',
      })
    }
  }

  public async getFilesByProject({ params, response }: HttpContext) {
    try {
      const { projectId } = params

      const files = await FileDokumentasi.find({ projectId })

      return response.status(200).json(files)
    } catch (error) {
      console.error('Error get files by project:', error)

      return response.status(500).json({
        message: 'Gagal mengambil data',
      })
    }
  }
}
