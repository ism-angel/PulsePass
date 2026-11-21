import { describe, expect, it } from 'vitest'

/**
 * Verificación estática de los anti-patrones prohibidos (PRD §16 y §24) sobre el código de la app
 * (se excluyen las pruebas). Complementa las reglas de ESLint.
 */
const fuentes = import.meta.glob<string>(
  ['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!../test/**'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
)

const archivos = Object.entries(fuentes)

function quienesContienen(patron: RegExp) {
  return archivos.filter(([, codigo]) => patron.test(codigo)).map(([ruta]) => ruta)
}

describe('Anti-patrones prohibidos (§24)', () => {
  it('se analizan los archivos de la app', () => {
    expect(archivos.length).toBeGreaterThan(60)
  })
  it('sin react-router-dom ni <BrowserRouter> (§24.7)', () => {
    expect(quienesContienen(/from ['"]react-router-dom['"]|<BrowserRouter/)).toEqual([])
  })
  it('sin React.FC ni any explícito (FE-011)', () => {
    expect(quienesContienen(/React\.FC|:\s*FC</)).toEqual([])
    expect(quienesContienen(/:\s*any\b|as any\b|<any>/)).toEqual([])
  })
  it('sin localStorage ni cookies (§24.6)', () => {
    expect(quienesContienen(/localStorage\s*[.[]|document\.cookie/)).toEqual([])
  })
  it('sin dangerouslySetInnerHTML (§24.10)', () => {
    expect(quienesContienen(/dangerouslySetInnerHTML/)).toEqual([])
  })
  it('sin clases Tailwind construidas dinámicamente (§24.4)', () => {
    expect(quienesContienen(/(bg|text|border|from|to)-\$\{/)).toEqual([])
  })
  it('sin reglas de negocio de edad/capacidad en la UI (§24.1, AC-FE-021)', () => {
    expect(
      quienesContienen(
        /minimumAge\s*[<>]=?|[<>]=?\s*\w*\.minimumAge|capacity\s*[<>]|[<>]=?\s*\w*\.capacity/,
      ),
    ).toEqual([])
  })
  it('sin useEffect + fetch para datos de servidor (§24.9): fetch solo en lib/http.ts', () => {
    expect(quienesContienen(/\bfetch\(/)).toEqual(['../lib/http.ts'])
  })
  it('sin console.log con datos (12.5)', () => {
    expect(quienesContienen(/console\.log/)).toEqual([])
  })
})
