// MATERIALS CONTROLLER
// Medtic Interior Monitoring System
//
// FINAL FEATURE:
// ✅ Material CRUD
// ✅ Stock In
// ✅ Stock Out
// ✅ Activity log / notification support

import type { HttpContext } from '@adonisjs/core/http'
import Material from '#models/material'
import { createActivityLog } from '#services/activity_log_service'

function getCurrentUserId(ctx: HttpContext) {
  const user = (ctx as any).auth?.user
  return user?.id ? Number(user.id) : null
}

function materialResponse(material: Material) {
  return {
    id: material.id,
    name: material.name,
    description: material.description || '',
    category: material.category,
    sku: material.sku,
    stock: material.stock,
    unit: material.unit,
    price: material.price,

    stockIn: material.stockIn || 0,
    stockOut: material.stockOut || 0,
    stock_in: material.stockIn || 0,
    stock_out: material.stockOut || 0,

    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
    lastUpdated: material.updatedAt?.toISODate() || null,
  }
}

export default class MaterialsController {
  async index({ request, response }: HttpContext) {
    const monthInput = request.input('month')
    const yearInput = request.input('year')

    const month = monthInput ? Number(monthInput) : null
    const year = yearInput ? Number(yearInput) : null

    const query = Material.query().orderBy('created_at', 'desc')

    if (year && Number.isInteger(year)) {
      query.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
    }

    if (month && Number.isInteger(month) && month >= 1 && month <= 12) {
      query.whereRaw('EXTRACT(MONTH FROM created_at) = ?', [month])
    }

    const materials = await query

    return response.ok({
      message: 'Data material berhasil diambil.',
      data: materials.map((material) => materialResponse(material)),
    })
  }

  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const name = String(request.input('name') || '').trim()
    const description = String(request.input('description') || '').trim()
    const category = String(request.input('category') || '').trim()
    const sku = String(request.input('sku') || '').trim()
    const stock = Number(request.input('stock') || 0)
    const unit = String(request.input('unit') || 'pcs').trim()
    const price = Number(request.input('price') || 0)

    if (!name || !category || !sku || stock < 0 || !unit) {
      return response.badRequest({
        message: 'Nama, kategori, SKU, stok, dan satuan wajib diisi.',
      })
    }

    const existingSku = await Material.findBy('sku', sku)

    if (existingSku) {
      return response.conflict({
        message: 'SKU sudah digunakan. Gunakan SKU lain.',
      })
    }

    const material = await Material.create({
      name,
      description: description || null,
      category,
      sku,
      stock,
      unit,
      price,

      // Stok awal dihitung sebagai barang masuk awal
      stockIn: stock,
      stockOut: 0,
    })

    await createActivityLog({
      userId,
      module: 'material',
      action: 'created',
      title: 'Material baru ditambahkan',
      description: `Material ${material.name} berhasil ditambahkan ke stok material.`,
      icon: 'ticket',
      color: 'green',
      metadata: {
        materialId: material.id,
        materialName: material.name,
        sku: material.sku,
        category: material.category,
        initialStock: material.stock,
        unit: material.unit,
        price: material.price,
      },
    })

    if (stock > 0) {
      await createActivityLog({
        userId,
        module: 'material',
        action: 'stock_initial',
        title: 'Stok awal material dicatat',
        description: `Stok awal ${material.name} sebanyak ${stock} ${unit} berhasil dicatat.`,
        icon: 'ticket',
        color: 'cyan',
        metadata: {
          materialId: material.id,
          materialName: material.name,
          sku: material.sku,
          quantity: stock,
          unit: material.unit,
          stock: material.stock,
          stockIn: material.stockIn,
          stockOut: material.stockOut,
        },
      })
    }

    return response.created({
      message: 'Material berhasil ditambahkan.',
      data: materialResponse(material),
    })
  }

  async update(ctx: HttpContext) {
    const { params, request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const material = await Material.find(params.id)

    if (!material) {
      return response.notFound({
        message: 'Material tidak ditemukan.',
      })
    }

    const oldMaterial = {
      id: material.id,
      name: material.name,
      category: material.category,
      sku: material.sku,
      stock: material.stock,
      unit: material.unit,
      price: material.price,
      stockIn: material.stockIn,
      stockOut: material.stockOut,
    }

    const name = String(request.input('name') || '').trim()
    const description = String(request.input('description') || '').trim()
    const category = String(request.input('category') || '').trim()
    const sku = String(request.input('sku') || '').trim()
    const stock = Number(request.input('stock') || 0)
    const unit = String(request.input('unit') || 'pcs').trim()
    const price = Number(request.input('price') || 0)

    const stockIn = Number(
      request.input('stockIn') ?? request.input('stock_in') ?? material.stockIn ?? 0
    )

    const stockOut = Number(
      request.input('stockOut') ?? request.input('stock_out') ?? material.stockOut ?? 0
    )

    if (!name || !category || !sku || stock < 0 || !unit) {
      return response.badRequest({
        message: 'Nama, kategori, SKU, stok, dan satuan wajib diisi.',
      })
    }

    const duplicateSku = await Material.query()
      .where('sku', sku)
      .whereNot('id', material.id)
      .first()

    if (duplicateSku) {
      return response.conflict({
        message: 'SKU sudah digunakan oleh material lain.',
      })
    }

    material.merge({
      name,
      description: description || null,
      category,
      sku,
      stock,
      unit,
      price,
      stockIn,
      stockOut,
    })

    await material.save()

    await createActivityLog({
      userId,
      module: 'material',
      action: 'updated',
      title: 'Material diperbarui',
      description: `Data material ${material.name} berhasil diperbarui.`,
      icon: 'ticket',
      color: 'blue',
      metadata: {
        materialId: material.id,
        oldName: oldMaterial.name,
        newName: material.name,
        oldCategory: oldMaterial.category,
        newCategory: material.category,
        oldSku: oldMaterial.sku,
        newSku: material.sku,
        oldStock: oldMaterial.stock,
        newStock: material.stock,
        oldUnit: oldMaterial.unit,
        newUnit: material.unit,
        oldPrice: oldMaterial.price,
        newPrice: material.price,
        oldStockIn: oldMaterial.stockIn,
        newStockIn: material.stockIn,
        oldStockOut: oldMaterial.stockOut,
        newStockOut: material.stockOut,
      },
    })

    return response.ok({
      message: 'Material berhasil diperbarui.',
      data: materialResponse(material),
    })
  }

  async stockIn(ctx: HttpContext) {
    const { params, request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const material = await Material.find(params.id)

    if (!material) {
      return response.notFound({
        message: 'Material tidak ditemukan.',
      })
    }

    const quantity = Number(request.input('quantity') || 0)

    if (quantity <= 0) {
      return response.badRequest({
        message: 'Jumlah barang masuk harus lebih dari 0.',
      })
    }

    const oldStock = Number(material.stock || 0)
    const oldStockIn = Number(material.stockIn || 0)

    material.stock = oldStock + quantity
    material.stockIn = oldStockIn + quantity

    await material.save()

    await createActivityLog({
      userId,
      module: 'material',
      action: 'stock_in',
      title: 'Stok material masuk',
      description: `Stok ${material.name} bertambah ${quantity} ${material.unit}.`,
      icon: 'ticket',
      color: 'green',
      metadata: {
        materialId: material.id,
        materialName: material.name,
        sku: material.sku,
        quantity,
        unit: material.unit,
        oldStock,
        newStock: material.stock,
        oldStockIn,
        newStockIn: material.stockIn,
        stockOut: material.stockOut,
      },
    })

    return response.ok({
      message: 'Barang masuk berhasil dicatat.',
      data: materialResponse(material),
    })
  }

  async stockOut(ctx: HttpContext) {
    const { params, request, response } = ctx
    const userId = getCurrentUserId(ctx)

    const material = await Material.find(params.id)

    if (!material) {
      return response.notFound({
        message: 'Material tidak ditemukan.',
      })
    }

    const quantity = Number(request.input('quantity') || 0)

    if (quantity <= 0) {
      return response.badRequest({
        message: 'Jumlah barang keluar harus lebih dari 0.',
      })
    }

    if (quantity > Number(material.stock || 0)) {
      return response.badRequest({
        message: 'Jumlah barang keluar tidak boleh melebihi stok saat ini.',
      })
    }

    const oldStock = Number(material.stock || 0)
    const oldStockOut = Number(material.stockOut || 0)

    material.stock = oldStock - quantity
    material.stockOut = oldStockOut + quantity

    await material.save()

    await createActivityLog({
      userId,
      module: 'material',
      action: 'stock_out',
      title: 'Stok material keluar',
      description: `Stok ${material.name} berkurang ${quantity} ${material.unit}.`,
      icon: 'ticket',
      color: 'yellow',
      metadata: {
        materialId: material.id,
        materialName: material.name,
        sku: material.sku,
        quantity,
        unit: material.unit,
        oldStock,
        newStock: material.stock,
        stockIn: material.stockIn,
        oldStockOut,
        newStockOut: material.stockOut,
      },
    })

    return response.ok({
      message: 'Barang keluar berhasil dicatat.',
      data: materialResponse(material),
    })
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const userId = getCurrentUserId(ctx)

    const material = await Material.find(params.id)

    if (!material) {
      return response.notFound({
        message: 'Material tidak ditemukan.',
      })
    }

    const deletedMaterial = {
      id: material.id,
      name: material.name,
      category: material.category,
      sku: material.sku,
      stock: material.stock,
      unit: material.unit,
      price: material.price,
      stockIn: material.stockIn,
      stockOut: material.stockOut,
    }

    await material.delete()

    await createActivityLog({
      userId,
      module: 'material',
      action: 'deleted',
      title: 'Material dihapus',
      description: `Material ${deletedMaterial.name} berhasil dihapus dari stok material.`,
      icon: 'ticket',
      color: 'red',
      metadata: {
        materialId: deletedMaterial.id,
        materialName: deletedMaterial.name,
        category: deletedMaterial.category,
        sku: deletedMaterial.sku,
        stock: deletedMaterial.stock,
        unit: deletedMaterial.unit,
        price: deletedMaterial.price,
        stockIn: deletedMaterial.stockIn,
        stockOut: deletedMaterial.stockOut,
      },
    })

    return response.ok({
      message: 'Material berhasil dihapus.',
    })
  }
}
