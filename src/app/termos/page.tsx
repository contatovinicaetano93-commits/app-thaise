import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { DATA_CONTROLLER, PRIVACY_POLICY_VERSION } from '@/lib/legal/constants'

export const metadata: Metadata = {
  title: 'Termos de Uso — Estlar',
  description: 'Termos de uso do Hub de Arquitetura Estlar e do formulário de mapeamento.',
}

export default function TermosPage() {
  return (
    <LegalPageLayout title="Termos de Uso" updatedAt={PRIVACY_POLICY_VERSION}>
      <p>
        Ao utilizar o site, o formulário de mapeamento (<code>/intake</code>) ou o Hub restrito da{' '}
        <strong>{DATA_CONTROLLER.name}</strong>, você concorda com estes Termos. Se não concordar,
        não utilize os serviços.
      </p>

      <h2>1. Serviços</h2>
      <p>
        A Estlar oferece serviços de arquitetura, curadoria e gestão de projetos. O mapeamento inicial
        é uma etapa de qualificação comercial e <strong>não constitui proposta contratual</strong> nem
        garantia de aceite do projeto.
      </p>

      <h2>2. Cadastro e acesso ao Hub</h2>
      <p>
        O acesso ao Hub é mediante convite, credenciais individuais e perfis definidos (gestor, cliente,
        fornecedor). Você é responsável por manter a confidencialidade da senha e por atividades
        realizadas em sua conta.
      </p>

      <h2>3. Uso aceitável</h2>
      <ul>
        <li>Fornecer informações verdadeiras e atualizadas</li>
        <li>Não tentar acessar áreas ou dados de outros usuários sem autorização</li>
        <li>Não utilizar o sistema para fins ilícitos ou que comprometam a segurança</li>
        <li>Respeitar a confidencialidade de informações de projetos exibidas no Hub</li>
      </ul>

      <h2>4. Propriedade intelectual</h2>
      <p>
        Conteúdos, metodologias, relatórios e materiais produzidos pela Estlar permanecem protegidos
        por direitos autorais e contratos específicos de prestação de serviços. O uso fora do escopo
        acordado requer autorização prévia por escrito.
      </p>

      <h2>5. Disponibilidade</h2>
      <p>
        Empregamos esforços razoáveis para manter o Hub disponível, mas não garantimos operação
        ininterrupta. Manutenções e indisponibilidades de terceiros (hospedagem, e-mail) podem ocorrer.
      </p>

      <h2>6. Limitação de responsabilidade</h2>
      <p>
        Na extensão permitida pela lei, a Estlar não se responsabiliza por danos indiretos decorrentes
        do uso do site ou do Hub. Obrigações comerciais e de entrega de projeto regem-se pelo contrato
        firmado entre as partes.
      </p>

      <h2>7. Privacidade</h2>
      <p>
        O tratamento de dados pessoais é regido pela nossa{' '}
        <a href="/privacidade">Política de Privacidade</a>, parte integrante destes Termos.
      </p>

      <h2>8. Alterações e contato</h2>
      <p>
        Podemos atualizar estes Termos. O uso continuado após publicação de nova versão constitui
        aceite. Dúvidas:{' '}
        <a href={`mailto:${DATA_CONTROLLER.email}`}>{DATA_CONTROLLER.email}</a>.
      </p>

      <p className="text-sm text-[var(--estlar-titanium)] not-prose mt-8">
        Texto base para operação — recomenda-se revisão jurídica antes do go-live comercial amplo.
      </p>
    </LegalPageLayout>
  )
}
