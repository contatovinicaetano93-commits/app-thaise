export type BriefingType = 'corporativo' | 'residencial' | 'comercial' | 'desenvolvimento'

export interface BriefingQuestion {
  id: string
  label: string
}

export const BRIEFING_QUESTIONS: Record<BriefingType, BriefingQuestion[]> = {
  corporativo: [
    { id: 'msg_silenciosa', label: 'Qual mensagem silenciosa este espaço precisa passar para clientes ou investidores?' },
    { id: 'dreno_energia', label: 'O que mais drena energia ou produtividade da equipe no espaço atual?' },
    { id: 'crescimento_3anos', label: 'Se a empresa dobrar em 3 anos, como o espaço precisa reagir?' },
  ],
  residencial: [
    { id: 'momento_inegociavel', label: 'Qual momento do dia em casa é inegociável e precisa ser blindado de estresse?' },
    { id: 'receber_pessoas', label: 'Como você gosta de receber — jantar formal ou algo descontraído para a família?' },
    { id: 'maior_frustracao', label: 'Em obras passadas, qual foi a maior frustração?' },
  ],
  comercial: [
    { id: 'experiencia_cliente', label: 'Qual experiência o cliente deve ter ao entrar no espaço?' },
    { id: 'fluxo_operacional', label: 'Como o fluxo operacional atual limita vendas ou atendimento?' },
    { id: 'diferencial_marca', label: 'Qual diferencial da marca precisa ser tangível no ambiente?' },
  ],
  desenvolvimento: [
    { id: 'vocacao_ativo', label: 'Qual a vocação do ativo (hotel, residencial, misto)?' },
    { id: 'meta_vgv', label: 'Qual meta de VGV ou rentabilidade para o empreendimento?' },
    { id: 'prazo_lancamento', label: 'Qual o prazo-alvo de lançamento ou entrega?' },
  ],
}

export type BriefingData = Record<string, string>

export function briefingTypeFromScope(scope: string | undefined): BriefingType {
  if (scope === 'corporativo' || scope === 'residencial' || scope === 'comercial' || scope === 'desenvolvimento') {
    return scope
  }
  return 'residencial'
}
