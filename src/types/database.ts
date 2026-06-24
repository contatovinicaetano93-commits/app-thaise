import type { QcpsScores } from '@/lib/qcps'
import type { ProjectPhase } from '@/lib/phases'
import type { PhaseChecklist, Profile, AgentInsight, JobLog } from '@/lib/auth/roles'

export type SupplierStatus = 'active' | 'inactive' | 'pending'
export type OrderStatus = 'pending' | 'approved' | 'processing' | 'delivered' | 'cancelled'
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface Supplier extends QcpsScores {
  id: string
  name: string
  category: string
  contact_name: string
  contact_email: string
  contact_phone: string
  website?: string
  score: number
  status: SupplierStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  segment?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Project extends QcpsScores {
  id: string
  name: string
  client_id?: string | null
  location?: string | null
  description?: string | null
  phase: ProjectPhase
  status: ProjectStatus
  checklist?: PhaseChecklist
  notes?: string | null
  created_at: string
  updated_at: string
  client?: Client
}

export interface Product {
  id: string
  supplier_id: string
  name: string
  description?: string
  category: string
  price: number
  unit: string
  min_order?: number
  lead_time_days?: number
  active: boolean
  created_at: string
}

export interface Order {
  id: string
  project_id?: string | null
  client_id: string
  supplier_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  status: OrderStatus
  notes?: string
  created_at: string
  updated_at: string
  client?: Client
  supplier?: Supplier
  product?: Product
  project?: Project
}

export interface Database {
  public: {
    Tables: {
      suppliers: { Row: Supplier; Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'score'>; Update: Partial<Omit<Supplier, 'score'>> }
      clients: { Row: Client; Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Client> }
      projects: { Row: Project; Insert: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client'>; Update: Partial<Omit<Project, 'client'>> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Product> }
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'total_price' | 'client' | 'supplier' | 'product' | 'project'>; Update: Partial<Order> }
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      job_logs: { Row: JobLog; Insert: Omit<JobLog, 'id' | 'created_at'>; Update: Partial<JobLog> }
      agent_insights: { Row: AgentInsight; Insert: Omit<AgentInsight, 'id' | 'created_at'>; Update: Partial<AgentInsight> }
    }
  }
}
