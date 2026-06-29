import type { QcpsScores, HomologationTier } from '@/lib/qcps'
import type { ProjectPhase } from '@/lib/phases'
import type { OpportunitySource, OpportunityStage } from '@/lib/pipeline'
import type { IntakeData, IntakeStatus } from '@/lib/intake'
import type { BriefingData, BriefingType } from '@/lib/briefing'
import type { PhaseChecklist, Profile, AgentInsight, JobLog } from '@/lib/auth/roles'

export type FeeModel = 'fixo' | 'variavel' | 'hibrido'
export type WeeklyReportStatus = 'draft' | 'approved' | 'sent'
export type AmendmentStatus = 'draft' | 'approved' | 'rejected'

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
  homologation_tier?: HomologationTier | null
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

export interface Opportunity {
  id: string
  name: string
  company?: string | null
  email: string
  phone: string
  source: OpportunitySource
  budget_estimate?: number | null
  stage: OpportunityStage
  notes?: string | null
  lost_reason?: string | null
  client_id?: string | null
  project_id?: string | null
  intake_data?: IntakeData | null
  intake_score?: number | null
  intake_status?: IntakeStatus | null
  briefing_data?: BriefingData | null
  briefing_type?: BriefingType | null
  fee_model?: FeeModel | null
  fee_fixed?: number | null
  fee_variable_pct?: number | null
  signal_paid?: boolean | null
  intake_consent_at?: string | null
  intake_consent_version?: string | null
  intake_consent_ip?: string | null
  created_at: string
  updated_at: string
  closed_at?: string | null
}

export interface WelcomeKit {
  id: string
  project_id: string
  content: string
  generated_at: string
}

export interface WeeklyReport {
  id: string
  project_id: string
  week_label: string
  week_start: string
  completed: string[]
  next_steps: string[]
  risks?: string | null
  schedule_pct?: number | null
  budget_status?: string | null
  status: WeeklyReportStatus
  generated_at: string
  approved_at?: string | null
  sent_at?: string | null
}

export interface ProjectDiaryEntry {
  id: string
  project_id: string
  week_start: string
  planned?: string | null
  actual?: string | null
  risks?: string | null
  created_at: string
  updated_at: string
}

export interface ScopeAmendment {
  id: string
  project_id: string
  number: number
  description: string
  amount: number
  days_added: number
  status: AmendmentStatus
  created_at: string
  approved_at?: string | null
}

export interface Quotation {
  id: string
  project_id: string
  supplier_id?: string | null
  description: string
  amount: number
  score_q: number
  score_c: number
  score_p: number
  score_s: number
  qcps_total?: number | null
  selected: boolean
  created_at: string
  supplier?: Supplier
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
  progress_pct?: number
  portal_enabled?: boolean
  current_phase_id?: string | null
  created_at: string
  updated_at: string
  client?: Client
  phases?: ProjectPhaseRow[]
  current_phase?: ProjectPhaseRow | null
}

export interface ProjectPhaseRow {
  id: string
  project_id: string
  name: string
  sort_order: number
  weight_pct: number
  created_at: string
  updated_at: string
}

export type CatalogStatus = 'pending' | 'approved' | 'rejected'
export type SkuRequestStatus = 'open' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
export type ProjectQuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled' | 'fulfilled'

export interface ProjectQuoteLine {
  id: string
  quote_id: string
  product_id: string
  supplier_id: string
  quantity: number
  unit_price: number
  line_total: number
  notes?: string | null
  sort_order: number
  created_at: string
  product?: Pick<Product, 'id' | 'name' | 'unit' | 'category'>
  supplier?: Pick<Supplier, 'id' | 'name'>
}

export interface ProjectQuote {
  id: string
  project_id: string
  client_id: string
  version: number
  title: string
  status: ProjectQuoteStatus
  notes?: string | null
  total_price: number
  sent_at?: string | null
  decided_at?: string | null
  decided_by?: string | null
  fulfilled_at?: string | null
  rejection_note?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  project?: Pick<Project, 'id' | 'name' | 'client_id'>
  client?: Pick<Client, 'id' | 'name'>
  lines?: ProjectQuoteLine[]
}

export interface SkuRequest {
  id: string
  project_id: string
  supplier_id: string
  name: string
  category: string
  unit: string
  quantity_estimated?: number | null
  due_date?: string | null
  notes?: string | null
  status: SkuRequestStatus
  product_id?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  project?: Pick<Project, 'id' | 'name' | 'client_id'>
  supplier?: Pick<Supplier, 'id' | 'name'>
  product?: Pick<Product, 'id' | 'name' | 'price' | 'unit' | 'catalog_status' | 'active'>
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
  sku_request_id?: string | null
  project_id?: string | null
  catalog_status?: CatalogStatus
  created_at: string
  supplier?: Pick<Supplier, 'id' | 'name'>
  project?: Pick<Project, 'id' | 'name'>
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

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      suppliers: { Row: Supplier; Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'score'>; Update: Partial<Omit<Supplier, 'score'>> }
      clients: { Row: Client; Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Client> }
      opportunities: { Row: Opportunity; Insert: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'closed_at' | 'client_id' | 'project_id'>; Update: Partial<Opportunity> }
      projects: { Row: Project; Insert: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client'>; Update: Partial<Omit<Project, 'client'>> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Product> }
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'total_price' | 'client' | 'supplier' | 'product' | 'project'>; Update: Partial<Order> }
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      job_logs: { Row: JobLog; Insert: Omit<JobLog, 'id' | 'created_at'>; Update: Partial<JobLog> }
      agent_insights: { Row: AgentInsight; Insert: Omit<AgentInsight, 'id' | 'created_at'>; Update: Partial<AgentInsight> }
      weekly_reports: { Row: WeeklyReport; Insert: Omit<WeeklyReport, 'id' | 'generated_at' | 'approved_at' | 'sent_at'>; Update: Partial<WeeklyReport> }
      welcome_kits: { Row: WelcomeKit; Insert: Omit<WelcomeKit, 'id' | 'generated_at'>; Update: Partial<WelcomeKit> }
      project_diary_entries: { Row: ProjectDiaryEntry; Insert: Omit<ProjectDiaryEntry, 'id' | 'created_at' | 'updated_at'>; Update: Partial<ProjectDiaryEntry> }
      scope_amendments: { Row: ScopeAmendment; Insert: Omit<ScopeAmendment, 'id' | 'created_at' | 'approved_at'>; Update: Partial<ScopeAmendment> }
      quotations: { Row: Quotation; Insert: Omit<Quotation, 'id' | 'created_at' | 'supplier'>; Update: Partial<Omit<Quotation, 'supplier'>> }
      webhooks: { Row: Webhook; Insert: Omit<Webhook, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Webhook> }
    }
  }
}
