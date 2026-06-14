import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0])
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:3000/api/import/excel', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Erreur de connexion au serveur' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7' }}>
      {/* SIDEBAR */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: 220, background: '#1a1a8e', minHeight: '100vh', padding: '20px 0', color: 'white' }}>
          <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: 16 }}>📚 Tuteur en Poche</div>
          <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.15)' }}>📄 Gestion du contenu</div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, padding: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Importer via Excel</h1>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>Chargez l'intégralité du contenu d'une matière en une seule opération</p>

          <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {/* DROP ZONE */}
            <div style={{ border: '2px dashed #c7d2fe', borderRadius: 12, padding: 48, textAlign: 'center', background: '#eef2ff', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📤</div>
              <h3 style={{ color: '#1a1a8e', marginBottom: 8 }}>Sélectionnez votre fichier Excel</h3>
              <input type="file" accept=".xlsx" onChange={handleFileChange} style={{ marginBottom: 12 }} />
              {file && <p style={{ color: '#16a34a', fontWeight: 600 }}>✅ {file.name}</p>}
            </div>

            <button
              onClick={handleImport}
              disabled={!file || loading}
              style={{
                background: loading ? '#9ca3af' : '#1a1a8e',
                color: 'white', border: 'none', padding: '10px 24px',
                borderRadius: 8, cursor: file && !loading ? 'pointer' : 'not-allowed',
                fontWeight: 600, fontSize: 14
              }}
            >
              {loading ? '⏳ Import en cours...' : '📥 Lancer l\'import'}
            </button>

            {/* RESULTAT */}
            {result && (
              <div style={{
                marginTop: 24, padding: 20, borderRadius: 10,
                background: result.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`
              }}>
                {result.success ? (
                  <>
                    <h3 style={{ color: '#16a34a', marginBottom: 12 }}>✅ Import réussi !</h3>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {Object.entries(result.stats).map(([key, val]) => (
                        <div key={key} style={{ background: 'white', border: '1px solid #d1fae5', borderRadius: 8, padding: '8px 14px' }}>
                          <strong style={{ color: '#16a34a' }}>{val as number}</strong> {key}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 style={{ color: '#dc2626', marginBottom: 12 }}>❌ Erreurs détectées</h3>
                    {result.errors?.map((err: any, i: number) => (
                      <div key={i} style={{ background: 'white', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, marginRight: 8, fontFamily: 'monospace' }}>
                          {err.sheet} · ligne {err.line}
                        </span>
                        {err.message}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App