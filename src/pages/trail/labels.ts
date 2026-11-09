/**
 * Vocabulário da trilha em um só lugar: troque aqui para mudar o tom
 * (por exemplo, "Estação" por "Fase" ou "Medalha" por "Selo").
 */
export const L = {
  trail: 'Trilha da Inovação',
  organization: 'Prefeitura de São Luís',
  organizerPanel: 'Painel do organizador',
  station: 'Estação',
  stations: 'Estações',
  room: 'Mesa',
  rooms: 'Mesas',
  medal: 'Medalha',
  medals: 'Medalhas',
  start: 'Largada',
  startHint: 'Comece aqui',
  finish: 'Chegada',
  finishHint: 'Seu plano de 90 dias',
  done: 'Concluída',
  inProgress: 'Disponível',
  locked: 'Bloqueada',
  finishedTitle: 'Trilha concluída',
  finishedBody: 'Você passou pelas cinco estações. Agora a mesa escolhe o piloto e você monta o seu plano de 90 dias.',
  stationDone: 'Estação concluída',
  guide: 'Guia',
  pilot: 'Piloto',
  sheet: 'Ficha do Piloto',
  plan: 'Plano de ação',
} as const

/** A Largada é a etapa 0; a Chegada vem depois das cinco estações. */
export const LARGADA = 0
export const TOTAL_STATIONS = 5
export const CHEGADA = TOTAL_STATIONS + 1

export const stationOf = (n: number, total = 5) => `${L.station} ${n} de ${total}`
