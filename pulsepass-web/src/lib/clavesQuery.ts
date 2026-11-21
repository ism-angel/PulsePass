/** queryKeys de TanStack Query (PRD §14.1). Centralizadas para invalidar con precisión. */
export const CLAVES = {
  sesion: (token: string | null) => ['sesion', 'me', token] as const,
  eventosPublicados: ['eventos', 'publicados'] as const,
  evento: (eventCode: string) => ['evento', eventCode] as const,
  eventosPorArtista: (stageName: string) => ['eventos', 'artista', stageName] as const,
  artistasActivos: ['artistas', 'activos'] as const,
  artista: (id: number) => ['artista', id] as const,
  artistaPorNombre: (stageName: string) => ['artista', 'nombre', stageName] as const,
  sedesActivas: ['sedes', 'activas'] as const,
  sede: (code: string) => ['sede', code] as const,
  usuario: (email: string) => ['usuario', email] as const,
  usuarioPorUsername: (username: string) => ['usuario', 'username', username] as const,
  ticketsUsuario: (email: string) => ['tickets', 'usuario', email] as const,
  ticket: (ticketCode: string) => ['ticket', ticketCode] as const,
  ticketsPagados: (eventCode: string) => ['tickets', 'pagados', eventCode] as const,
} as const
