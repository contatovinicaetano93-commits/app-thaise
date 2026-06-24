import type { ProjectPhase } from '@/lib/phases'

export const PHASE_PROMPTS: Record<ProjectPhase, { guia: string; pergunta: string }> = {
  A: {
    guia: 'Concepção — levante dados, valide viabilidade financeira (VPL/TIR) e defina o programa de necessidades.',
    pergunta: 'O estudo de viabilidade (EV) está aprovado? O programa de necessidades cobre todas as áreas?',
  },
  B: {
    guia: 'Definição — estudos preliminares, anteprojeto e projeto legal alinhados ao cliente.',
    pergunta: 'O anteprojeto foi validado pelo cliente? O projeto legal está em conformidade?',
  },
  C: {
    guia: 'Interfaces — custos, método construtivo e prazos integrados entre especialidades.',
    pergunta: 'Os custos estão dentro do orçamento? O método construtivo foi definido?',
  },
  D: {
    guia: 'Detalhamento — projeto executivo e sistemas prontos para obra.',
    pergunta: 'O PE está completo? As interfaces entre disciplinas foram resolvidas?',
  },
  E: {
    guia: 'Pós-projeto — checklist de entrega e saneamento de dúvidas.',
    pergunta: 'Todas as dúvidas projetuais foram sanadas? O cliente revisou a documentação?',
  },
  F: {
    guia: 'Pós-obra — checkout, as built e retroalimentação QCPS.',
    pergunta: 'O as built foi levantado? O scoring QCPS foi atualizado?',
  },
}
