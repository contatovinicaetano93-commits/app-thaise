import type { ProjectPhase } from '@/lib/phases'
import { CLIENT_PHASE_LABELS, PHASES } from '@/lib/phases'

export function generateWelcomeKitContent(params: {
  clientName: string
  projectName: string
  phase: ProjectPhase
}): string {
  const phaseLabel = CLIENT_PHASE_LABELS[params.phase]
  const allPhases = PHASES.map(p => {
    const client = CLIENT_PHASE_LABELS[p.id]
    return `• ${client.label}: ${client.desc}`
  }).join('\n')

  return [
    'BEM-VINDO À ESTLAR',
    '═'.repeat(40),
    '',
    `Olá, ${params.clientName}.`,
    '',
    `É com enorme satisfação que iniciamos a parceria no projeto "${params.projectName}".`,
    'Acreditamos que a arquitetura materializa visão com excelência, discrição e inteligência estratégica.',
    '',
    'A Estlar atua como seu Hub central de inteligência. Selecionamos, homologamos e coordenamos',
    'equipes do mercado para execução. Você terá um único ponto de contato: nós.',
    '',
    'O MÉTODO ESTLAR — FASES DO PROJETO',
    '─'.repeat(40),
    allPhases,
    '',
    `Fase atual: ${phaseLabel.label}`,
    '',
    'DINÂMICA DE COMUNICAÇÃO',
    '─'.repeat(40),
    '• Horário: segunda a sexta, 09h–18h',
    '• Canal oficial (e-mail): aprovações financeiras e decisões importantes',
    '• WhatsApp: avisos rápidos e agendamentos apenas',
    '• Relatório Executivo 360: toda sexta-feira, resumo da semana',
    '',
    'SEU PAPEL',
    '─'.repeat(40),
    '• Feedback honesto nas apresentações',
    '• Aprovações pontuais para manter o cronograma',
    '',
    'Próximo passo: Reunião de Imersão e Estratégia nas próximas 48 horas.',
    '',
    'Thaise Resende | Diretora Criativa e Executiva, Estlar',
    'contato.vinicaetano93@gmail.com',
  ].join('\n')
}
