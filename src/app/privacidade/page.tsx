import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { DATA_CONTROLLER, PRIVACY_POLICY_VERSION } from '@/lib/legal/constants'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Estlar',
  description: 'Como a Estlar trata dados pessoais no Hub de Arquitetura, em conformidade com a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <LegalPageLayout title="Política de Privacidade" updatedAt={PRIVACY_POLICY_VERSION}>
      <p>
        Esta Política descreve como <strong>{DATA_CONTROLLER.name}</strong>, sob responsabilidade de{' '}
        {DATA_CONTROLLER.responsible}, trata dados pessoais no formulário de mapeamento, no Hub interno
        e em comunicações relacionadas aos nossos serviços de arquitetura e gestão de projetos.
      </p>

      <h2>1. Controlador e contato</h2>
      <ul>
        <li><strong>Controlador:</strong> {DATA_CONTROLLER.name}</li>
        <li><strong>Responsável:</strong> {DATA_CONTROLLER.responsible}</li>
        <li><strong>E-mail para privacidade:</strong>{' '}
          <a href={`mailto:${DATA_CONTROLLER.email}`}>{DATA_CONTROLLER.email}</a>
        </li>
        <li><strong>Localização:</strong> {DATA_CONTROLLER.location}</li>
      </ul>

      <h2>2. Dados que coletamos</h2>
      <p>No mapeamento inicial (<code>/intake</code>) podemos coletar:</p>
      <ul>
        <li>Identificação: nome, e-mail, telefone, empresa (opcional)</li>
        <li>Informações do projeto: escopo, intervenção, expectativa de investimento, prazo</li>
        <li>Origem do contato (ex.: indicação, Instagram)</li>
        <li>Registro de consentimento: data, versão desta política e endereço IP (auditoria)</li>
      </ul>
      <p>
        Após qualificação comercial, dados adicionais de projeto podem ser tratados no Hub restrito,
        conforme contrato e necessidade operacional.
      </p>

      <h2>3. Finalidades e bases legais (LGPD)</h2>
      <ul>
        <li><strong>Atendimento e qualificação comercial</strong> — execução de procedimentos preliminares a contrato e legítimo interesse</li>
        <li><strong>Comunicação sobre o projeto</strong> — execução de contrato ou consentimento</li>
        <li><strong>Operação do Hub</strong> — execução de contrato e obrigação legal quando aplicável</li>
        <li><strong>Segurança e prevenção a fraudes</strong> — legítimo interesse (logs, rate limit, IP no consentimento)</li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>Podemos compartilhar dados com:</p>
      <ul>
        <li><strong>Supabase</strong> — hospedagem de banco de dados e autenticação</li>
        <li><strong>Vercel</strong> — hospedagem da aplicação</li>
        <li><strong>Resend</strong> — envio de e-mails transacionais (convites, notificações), quando configurado</li>
        <li><strong>Anthropic</strong> — processamento de texto para funcionalidades de IA internas, quando utilizadas</li>
      </ul>
      <p>
        Não vendemos dados pessoais. Parceiros operam sob contratos e medidas de segurança compatíveis
        com a finalidade do tratamento.
      </p>

      <h2>5. Retenção</h2>
      <p>
        Mantemos dados enquanto houver relação comercial ou necessidade legítima (ex.: histórico de
        projeto, obrigações legais). Leads não convertidos podem ser anonimizados ou excluídos após
        período razoável, mediante solicitação ou revisão interna.
      </p>

      <h2>6. Seus direitos</h2>
      <p>Nos termos da LGPD (Lei 13.709/2018), você pode solicitar:</p>
      <ul>
        <li>Confirmação e acesso aos dados</li>
        <li>Correção de dados incompletos ou desatualizados</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
        <li>Portabilidade, quando aplicável</li>
        <li>Revogação do consentimento e informações sobre compartilhamento</li>
      </ul>
      <p>
        Envie pedidos para{' '}
        <a href={`mailto:${DATA_CONTROLLER.email}`}>{DATA_CONTROLLER.email}</a>.
        Responderemos em prazo razoável conforme a ANPD.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Adotamos controles técnicos e organizacionais: autenticação, controle de acesso por perfil,
        criptografia em trânsito (HTTPS) e políticas de acesso restrito no banco de dados.
      </p>

      <h2>8. Alterações</h2>
      <p>
        Esta política pode ser atualizada. A versão vigente é indicada no topo desta página.
        Novos envios no mapeamento registram a versão aceita no momento do consentimento.
      </p>

      <p className="text-sm text-[var(--estlar-titanium)] not-prose mt-8">
        Texto base para operação — recomenda-se revisão jurídica antes do go-live comercial amplo.
      </p>
    </LegalPageLayout>
  )
}
