// Pack Registry - central listing of all domain packs.

import { socialImpactPack, type DomainPack } from './knowledge'
import { healthcarePack } from './healthcare-pack'
import { educationPack } from './education-pack'

export const PACKS: Record<string, DomainPack> = {
  'social-impact': socialImpactPack,
  'healthcare': healthcarePack,
  'education': educationPack,
}

export function getPack(id: string): DomainPack {
  return PACKS[id] ?? socialImpactPack
}

export function listPacks() {
  return Object.values(PACKS).map(p => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
    version: p.version,
    description: p.description,
  }))
}
