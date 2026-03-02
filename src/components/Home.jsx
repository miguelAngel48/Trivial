import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
    const [username, setUsername] = useState('')
    const [roomCode, setRoomCode] = useState('')
    const [id, setid] = useState('')
    const [mensaje, setMensaje] = useState('')

    const navigate = useNavigate()
    const API_URL = 'https://triviaapi.artemrudenko.com'

    const handleCreateRoom = async () => {
        if (!roomCode) {
            setMensaje('Por favor, escribe un código para la sala (ej: "SALA1")')
            return
        }
        try {
            const response = await fetch(`${API_URL}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: roomCode })
            })
            if (response.ok) {
                const data = await response.json()
                setid(data.id)
                setMensaje(` Sala creada. ID: ${data.id}`)
            } else {
                setMensaje(' Error al crear la sala')
            }
        } catch (error) {
            setMensaje('Error de conexión')
        }
    }

    const handleJoinRoom = async () => {
        if (!id || !username || !roomCode) {
            setMensaje('Faltan datos: ID de sala, código y usuario son necesarios')
            return
        }
        try {
            const response = await fetch(`${API_URL}/rooms/${id}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: roomCode, username: username })
            })
            if (response.ok) {
                const data = await response.json()
                localStorage.setItem('playerToken', data.token)

                navigate(`/room/${id}`, { state: { playerId: data.player.id } })
            } else {
                setMensaje(' Error al unirse')
            }
        } catch (error) {
            setMensaje('Error de conexión')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
            <h2>Bienvenido al Lobby</h2>

            <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="text"
                placeholder="Código de Sala"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
            />
            <input
                type="number"
                placeholder="ID de la Sala (Numérico)"
                value={id}
                onChange={(e) => setid(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                <button onClick={handleCreateRoom}>Crear Room</button>
                <button onClick={handleJoinRoom}>Unirse a Room</button>
            </div>
            <button onClick={() => navigate('/historial')}>
                Ver Historial de Partidas
            </button>

            {mensaje && <p style={{ fontWeight: 'bold' }}>{mensaje}</p>}
        </div>
    )
}