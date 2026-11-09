import { createAvatar } from '@dicebear/core'
import { notionists } from '@dicebear/collection'

const cache = new Map<string, string>()

// Variantes de cabelo do estilo notionists separadas por aparência
// (classificadas visualmente) para o avatar combinar com o nome do agente.
const FEMALE_HAIR = [
  'variant02', 'variant03', 'variant04', 'variant08', 'variant10',
  'variant11', 'variant17', 'variant20', 'variant23', 'variant26',
  'variant28', 'variant36', 'variant37', 'variant39', 'variant41',
  'variant43', 'variant45', 'variant46', 'variant47', 'variant48',
  'variant57', 'variant58', 'variant59', 'variant62', 'variant63',
]
const MALE_HAIR = [
  'variant01', 'variant05', 'variant06', 'variant07', 'variant09',
  'variant12', 'variant13', 'variant14', 'variant15', 'variant16',
  'variant18', 'variant19', 'variant21', 'variant22', 'variant24',
  'variant25', 'variant27', 'variant29', 'variant30', 'variant31',
  'variant33', 'variant34', 'variant35', 'variant38', 'variant40',
  'variant42', 'variant44', 'variant49', 'variant52', 'variant53',
  'variant54', 'variant55', 'variant56', 'variant60',
]

export function avatarUri(seed: string): string {
  const hit = cache.get(seed)
  if (hit) return hit
  let options: Record<string, unknown> = { seed }
  if (seed.startsWith('f-')) {
    options = { seed, hair: FEMALE_HAIR, beardProbability: 0 }
  } else if (seed.startsWith('m-')) {
    options = { seed, hair: MALE_HAIR }
  }
  const uri = createAvatar(notionists, options as never).toDataUri()
  cache.set(seed, uri)
  return uri
}

// Nomes femininos comuns que não terminam em "a".
const FEMALE_NAMES = new Set([
  'isabel', 'raquel', 'beatriz', 'ines', 'ester', 'esther', 'carmen',
  'ruth', 'rute', 'miriam', 'simone', 'michele', 'michelle', 'nicole',
  'ingrid', 'kelly', 'evelyn', 'denise', 'elaine', 'aline', 'jaqueline',
  'jacqueline', 'caroline', 'karoline', 'gabrielle', 'danielle',
  'rachel', 'liz', 'lais', 'thais', 'tais', 'iris',
])
// Nomes masculinos comuns que terminam em "a".
const MALE_NAMES = new Set(['luca', 'jonata', 'josue', 'nikita'])

function genderFromName(name: string): 'f' | 'm' | null {
  const first = name
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!first) return null
  if (MALE_NAMES.has(first)) return 'm'
  if (FEMALE_NAMES.has(first) || first.endsWith('a')) return 'f'
  return 'm'
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Seed de avatar coerente com o gênero aparente do nome do agente. */
export function seedForName(name: string): string {
  return applyGenderToSeed(name, randomSeed())
}

/** Reaproveita a parte aleatória da seed, ajustando o prefixo de gênero ao nome. */
export function applyGenderToSeed(name: string, seed: string): string {
  const base = seed.replace(/^[fm]-/, '')
  const gender = genderFromName(name)
  return gender ? `${gender}-${base}` : base
}
