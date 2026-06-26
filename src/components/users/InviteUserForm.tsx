'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams } from 'next/navigation'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { clientsApi, suppliersApi, usersApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Client, Supplier } from '@/types/database'
import { ROLE_LABELS, type UserRole } from '@/lib/auth/roles'

const schema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['fornecedor', 'cliente']),
  supplier_id: z.string().optional(),
  client_id: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'fornecedor' && !data.supplier_id) {
    ctx.addIssue({ code: 'custom', message: 'Selecione o fornecedor', path: ['supplier_id'] })
  }
  if (data.role === 'cliente' && !data.client_id) {
    ctx.addIssue({ code: 'custom', message: 'Selecione o cliente', path: ['client_id'] })
  }
})

type FormData = z.infer<typeof schema>

interface Props {
  onSuccess: () => void
}

export function InviteUserForm({ onSuccess }: Props) {
  const searchParams = useSearchParams()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const defaultRole = (searchParams.get('role') === 'cliente' ? 'cliente' : 'fornecedor') as 'fornecedor' | 'cliente'

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: defaultRole,
      supplier_id: searchParams.get('supplier_id') ?? '',
      client_id: searchParams.get('client_id') ?? '',
    },
  })

  const role = watch('role')

  useEffect(() => {
    Promise.all([suppliersApi.list(), clientsApi.list()])
      .then(([s, c]) => {
        setSuppliers(s)
        setClients(c)
      })
      .catch(() => toast.error('Erro ao carregar fornecedores/clientes'))
  }, [])

  useEffect(() => {
    const supplierId = searchParams.get('supplier_id')
    const clientId = searchParams.get('client_id')
    if (supplierId) setValue('supplier_id', supplierId)
    if (clientId) setValue('client_id', clientId)
  }, [searchParams, setValue])

  async function onSubmit(data: FormData) {
    try {
      await usersApi.invite({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        supplier_id: data.role === 'fornecedor' ? data.supplier_id : null,
        client_id: data.role === 'cliente' ? data.client_id : null,
      })
      toast.success('Login criado! Envie e-mail e senha para a pessoa.')
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao convidar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Tipo de acesso"
        error={errors.role?.message}
        options={[
          { value: 'fornecedor', label: 'Fornecedor' },
          { value: 'cliente', label: 'Cliente' },
        ]}
        {...register('role')}
      />

      <Input label="Nome completo" placeholder="Maria Silva" error={errors.full_name?.message} {...register('full_name')} />

      <Input
        label="E-mail de login"
        type="email"
        placeholder="maria@empresa.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Senha inicial"
        type="password"
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register('password')}
      />

      {role === 'fornecedor' && (
        <Select
          label="Vincular ao fornecedor"
          placeholder="Selecione…"
          error={errors.supplier_id?.message}
          options={suppliers.map(s => ({ value: s.id, label: `${s.name} · ${s.category}` }))}
          {...register('supplier_id')}
        />
      )}

      {role === 'cliente' && (
        <Select
          label="Vincular ao cliente"
          placeholder="Selecione…"
          error={errors.client_id?.message}
          options={clients.map(c => ({
            value: c.id,
            label: `${c.name}${c.company ? ` · ${c.company}` : ''}`,
          }))}
          {...register('client_id')}
        />
      )}

      <p className="text-xs text-gray-500">
        A pessoa usará este e-mail e senha em{' '}
        <span className="font-medium">app-thaise.vercel.app/login</span>.
        Peça para trocar a senha no primeiro acesso.
      </p>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={isSubmitting}>Criar login</Button>
      </div>
    </form>
  )
}

export function roleBadge(role: UserRole) {
  const colors: Record<UserRole, string> = {
    gestor: 'bg-violet-100 text-violet-700',
    fornecedor: 'bg-indigo-100 text-indigo-700',
    cliente: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${colors[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  )
}
