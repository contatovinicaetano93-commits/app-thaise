/**
 * Motor de simulação financeira — Fase A (viabilidade)
 * TIR, VPL e Payback simples para empreendimentos
 */

export interface SimulationInput {
  investimentoInicial: number
  fluxosAnuais: number[] // anos 1..N
  taxaDesconto: number // ex: 0.12 = 12% a.a.
}

export interface SimulationResult {
  vpl: number
  tir: number | null // null se não convergir
  paybackAnos: number | null
  viavel: boolean
  resumo: string
}

export function calcularVpl(investimento: number, fluxos: number[], taxa: number): number {
  let vpl = -investimento
  for (let t = 0; t < fluxos.length; t++) {
    vpl += fluxos[t] / Math.pow(1 + taxa, t + 1)
  }
  return Math.round(vpl * 100) / 100
}

export function calcularTir(investimento: number, fluxos: number[]): number | null {
  // Newton-Raphson simplificado
  let rate = 0.1
  for (let i = 0; i < 100; i++) {
    let npv = -investimento
    let dnpv = 0
    for (let t = 0; t < fluxos.length; t++) {
      const factor = Math.pow(1 + rate, t + 1)
      npv += fluxos[t] / factor
      dnpv -= (t + 1) * fluxos[t] / Math.pow(1 + rate, t + 2)
    }
    if (Math.abs(npv) < 0.01) return Math.round(rate * 10000) / 100
    if (dnpv === 0) break
    rate -= npv / dnpv
    if (rate < -0.99 || rate > 10) return null
  }
  return null
}

export function calcularPayback(investimento: number, fluxos: number[]): number | null {
  let acumulado = -investimento
  for (let t = 0; t < fluxos.length; t++) {
    acumulado += fluxos[t]
    if (acumulado >= 0) {
      const fracao = fluxos[t] > 0 ? (acumulado - fluxos[t] + investimento) / fluxos[t] : 1
      return Math.round((t + fracao) * 10) / 10
    }
  }
  return null
}

export function simular(input: SimulationInput): SimulationResult {
  const { investimentoInicial, fluxosAnuais, taxaDesconto } = input
  const vpl = calcularVpl(investimentoInicial, fluxosAnuais, taxaDesconto)
  const tir = calcularTir(investimentoInicial, fluxosAnuais)
  const paybackAnos = calcularPayback(investimentoInicial, fluxosAnuais)
  const viavel = vpl > 0 && (tir === null || tir > taxaDesconto * 100)

  const resumo = viavel
    ? `Viável: VPL ${vpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${tir != null ? `, TIR ${tir}%` : ''}${paybackAnos != null ? `, payback ${paybackAnos}a` : ''}`
    : `Inviável: VPL negativo (${vpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`

  return { vpl, tir, paybackAnos, viavel, resumo }
}

/** Defaults por tipo de empreendimento */
export const SIMULATION_TEMPLATES = {
  residencial: {
    investimentoInicial: 2_000_000,
    fluxosAnuais: [400_000, 500_000, 600_000, 700_000, 800_000],
    taxaDesconto: 0.12,
  },
  comercial: {
    investimentoInicial: 5_000_000,
    fluxosAnuais: [800_000, 1_000_000, 1_200_000, 1_400_000, 1_600_000],
    taxaDesconto: 0.14,
  },
} as const
