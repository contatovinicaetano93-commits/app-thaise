import { createServiceClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/notify/email'

export async function assertClientExists(clientId: string) {
  const db = createServiceClient()
  const { data } = await db.from('clients').select('id').eq('id', clientId).single()
  if (!data) throw new Error('Cliente não encontrado')
}

export async function assertActiveSupplier(supplierId: string) {
  const db = createServiceClient()
  const { data } = await db.from('suppliers').select('id, status').eq('id', supplierId).single() as {
    data: { id: string; status: string } | null
  }
  if (!data) throw new Error('Fornecedor não encontrado')
  if (data.status !== 'active') throw new Error('Fornecedor precisa estar ativo (homologado) para esta operação')
}

export async function assertProductForSupplier(productId: string, supplierId: string) {
  const db = createServiceClient()
  const { data } = await db.from('products').select('id, supplier_id, active, catalog_status').eq('id', productId).single() as {
    data: { id: string; supplier_id: string; active: boolean; catalog_status?: string } | null
  }
  if (!data) throw new Error('Produto não encontrado')
  if (data.supplier_id !== supplierId) throw new Error('Produto não pertence ao fornecedor selecionado')
  if (!data.active) throw new Error('Produto inativo — não pode ser usado em pedidos')
  if (data.catalog_status && data.catalog_status !== 'approved') {
    throw new Error('Produto aguardando aprovação da Estlar — não pode ser usado em pedidos')
  }
}

export async function assertProjectHasClient(clientId: string | null | undefined) {
  if (!clientId) throw new Error('Empreendimento exige um cliente vinculado (SIPOC: Input)')
}
