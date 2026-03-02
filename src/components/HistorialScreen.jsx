import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../HistorialScreen.css'

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
        <div className="contenedorHistorial">
            <button onClick={() => navigate('/')} className="botonVolver">
                Volver al Inicio
            </button>

            <h2>Historial de Partidas</h2>

            {sinConexion && (
                <div className="alertaOffline">
                    Estás sin conexión. Mostrando datos guardados localmente.
                </div>
            )}

            {historial.length === 0 ? (
                <p>Aún no has jugado ninguna partida o no hay datos guardados.</p>
            ) : (
                <div className="listaPartidas">
                    {historial.map((partida, index) => (
                        <div key={index} className="tarjetaPartida">
                            <p className="textoFecha"> Fecha: {partida.fecha}</p>
                            <h4>Resultados:</h4>
                            {Object.entries(partida.puntuaciones)
                                .sort(([, a], [, b]) => b - a)
                                .map(([id, pts], i) => (
                                    <p key={id} className="textoPuntuacion">
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