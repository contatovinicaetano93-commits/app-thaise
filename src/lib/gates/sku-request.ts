import { createServiceClient } from '@/lib/supabase-server'

export async function assertOpenSkuRequestForSupplier(skuRequestId: string, supplierId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('sku_requests')
    .select('id, supplier_id, status, project_id, name, category, unit, product_id')
    .eq('id', skuRequestId)
    .single() as {
    data: {
      id: string
      supplier_id: string
      status: string
      project_id: string
      name: string
      category: string
      unit: string
      product_id: string | null
    } | null
  }

  if (!data) throw new Error('Pedido de SKU não encontrado')
  if (data.supplier_id !== supplierId) throw new Error('Este pedido de SKU não é do seu fornecedor')
  if (!['open', 'rejected'].includes(data.status)) {
    throw new Error('Este pedido de SKU já foi respondido ou encerrado')
  }
  if (data.status === 'open' && data.product_id) {
    throw new Error('Este pedido de SKU já possui produto cadastrado')
  }

  return data
}
