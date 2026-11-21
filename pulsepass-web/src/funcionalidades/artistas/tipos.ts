import { z } from 'zod'

/** ArtistResponse.java — confirmado contra el backend (id, stageName, country, genre, active). */
export const ArtistResponseSchema = z.object({
  id: z.number().int(),
  stageName: z.string(),
  country: z.string().nullable(),
  genre: z.string().nullable(),
  active: z.boolean(),
})
export type ArtistResponse = z.infer<typeof ArtistResponseSchema>

export const ListaArtistasSchema = z.array(ArtistResponseSchema)

/** Parámetro :id de /artistas/:id. Si no es un entero positivo → 404 de UI sin llamar a la API. */
export const IdArtistaSchema = z.coerce.number().int().positive()
