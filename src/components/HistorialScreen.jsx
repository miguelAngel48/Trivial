import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HistorialScreen() {
    const navigate = useNavigate()
    const [historial, setHistorial] = useState([])
    const [sinConexion, setSinConexion] = useState(!navigator.onLine)

    useEffect(() => {

        const datosGuardados = JSON.parse(localStorage.getItem('historialTrivia') || '[]')
        setHistorial(datosGuardados)


        const offline = () => setSinConexion(true)
        const online = () => setSinConexion(false)

        window.addEventListener('offline', offline)
        window.addEventListener('online', online)

        return () => {
            window.removeEventListener('offline', offline)
            window.removeEventListener('online', online)
        }
    }, [])

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', color: 'inherit' }}>
            <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '10px', cursor: 'pointer' }}>
                Volver al Inicio
            </button>

            <h2>Historial de Partidas</h2>

            {sinConexion && (
                <div style={{ backgroundColor: '#ff9800', color: 'black', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
                    Estás sin conexión. Mostrando datos guardados localmente.
                </div>
            )}

            {historial.length === 0 ? (
                <p>Aún no has jugado ninguna partida o no hay datos guardados.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {historial.map((partida, index) => (
                        <div key={index} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                            <p style={{ color: 'gray', fontSize: '14px' }}> Fecha: {partida.fecha}</p>
                            <h4>Resultados:</h4>
                            {Object.entries(partida.puntuaciones)
                                .sort(([, a], [, b]) => b - a)
                                .map(([id, pts], i) => (
                                    <p key={id} style={{ margin: '5px 0' }}>
                                        {i + 1}. {partida.nombres[id] || `Jugador ${id}`}: <strong>{pts} pts</strong>
                                    </p>
                                ))
                            }
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}