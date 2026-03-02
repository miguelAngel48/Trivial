import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { roomService } from '../js/roomService'
export default function RoomDashboard() {
    const { roomId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    const playerId = location.state?.playerId

    const [room, setRoom] = useState(null)
    const [players, setPlayers] = useState([])
    const [teams, setTeams] = useState([])
    const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState({})
    const [rounds, setRounds] = useState(2)
    const [timePerRound, setTimePerRound] = useState(20)
    const [questionsPerRound, setQuestionsPerRound] = useState(4)
    const [mensaje, setMensaje] = useState('')

    const API_URL = 'https://triviaapi.artemrudenko.com'

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchRoom(), fetchPlayers(), fetchTeams()])
        }
        loadData()
        const token = localStorage.getItem('playerToken')
        if (!token) return;
        const eventSource = new EventSource(`${API_URL}/rooms/${roomId}/events?token=${token}`)

        eventSource.onopen = () => console.log(" Conectado a los eventos en vivo de la sala:", roomId)
        eventSource.onerror = (error) => console.error(" Error en la conexión en vivo (SSE):", error)
        eventSource.onmessage = (event) => console.log(" Evento sin nombre recibido:", event.data)

        eventSource.addEventListener('player-joined', (event) => {
            loadData()
        })
        eventSource.addEventListener('player-left', () => {
            setTimeout(loadData, 500)
        })


        eventSource.addEventListener('team-created', () => {
            loadData()
        })
        eventSource.addEventListener('team-deleted', () => {
            loadData()
        })
        eventSource.addEventListener('player-assigned-to-team', () => {
            loadData()
        })
        eventSource.addEventListener('player-removed-from-team', () => {
            loadData()
        })
        eventSource.addEventListener('game-created', (event) => {
            navigate(`/game/${event.data}`, { state: { roomId, playerId } })

        })

        return () => {
            eventSource.close()
        }
    }, [roomId, navigate])

    const fetchRoom = async () => {
        try {
            const data = await roomService.getRoom(roomId);
            setRoom(data)
        } catch (error) { console.error("Error cargando sala:", error) }
    }


    const fetchPlayers = async () => {
        try {
            const data = await roomService.getPlayers(roomId);
            setPlayers(data)
        } catch (error) { console.error("Error cargando jugadores:", error) }

    }


    const fetchTeams = async () => {
        try {
            const data = await roomService.getTeams(roomId);
            setTeams(data);
        } catch (error) { console.error("Error cargando equipos:", error) }
    }

    const isHost = room?.hostId === playerId
    const hostPlayer = players.find(p => p.id === room?.hostId)
    const unassignedPlayers = players.filter(p => p.teamId === null)


    const handleKickPlayer = async (targetPlayerId) => {
        if (!window.confirm("¿Seguro que quieres expulsar a este jugador de la sala?")) return;

        const token = localStorage.getItem('playerToken')
        try {
            const response = await fetch(`${API_URL}/rooms/${roomId}/players/${targetPlayerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                setMensaje(' Jugador expulsado de la sala')
                fetchPlayers()
            }
        } catch (error) { console.error("Error al expulsar:", error) }
    }

    const handleCreateTeam = async () => {
        const token = localStorage.getItem('playerToken')
        try {
            const response = await fetch(`${API_URL}/rooms/${roomId}/teams`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                setMensaje(' Equipo creado')
                fetchTeams()
            } else {
                setMensaje(' Error: Solo el Host puede crear equipos')
            }
        } catch (error) { console.error(error) }
    }

    const handleDeleteTeam = async (teamId) => {
        const token = localStorage.getItem('playerToken')
        const playersInTeam = players.filter(p => p.teamId === teamId)

        try {
            for (const p of playersInTeam) {
                await fetch(`${API_URL}/rooms/${roomId}/teams/${teamId}/players/${p.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            }
            const response = await fetch(`${API_URL}/rooms/${roomId}/teams/${teamId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                setMensaje(' Equipo borrado y jugadores liberados')
                fetchTeams()
                fetchPlayers()
            }
        } catch (error) { console.error(error) }
    }

    const handleAssignPlayerToTeam = async (teamId, targetPlayerId) => {
        if (!targetPlayerId) return;
        try {
            await roomService.assignPlayerToTeam(roomId, teamId, targetPlayerId)
            setMensaje(targetPlayerId === playerId ? ` Te has unido al equipo #${teamId}` : ` Jugador asignado`)
            fetchPlayers()
            setSelectedPlayersToAdd(prev => ({ ...prev, [teamId]: '' }))

        } catch (error) { console.error(error) }
    }

    const handleRemovePlayerFromTeam = async (teamId, targetPlayerId) => {
        const token = localStorage.getItem('playerToken')
        try {
            const response = await fetch(`${API_URL}/rooms/${roomId}/teams/${teamId}/players/${targetPlayerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                setMensaje(targetPlayerId === playerId ? ` Has salido del equipo` : ` Jugador expulsado del equipo`)
                fetchPlayers()
            }
        } catch (error) { console.error(error) }
    }

    const handleCreateGame = async () => {
        const token = localStorage.getItem('playerToken')
        try {
            const response = await fetch(`${API_URL}/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roomId: parseInt(roomId), rounds: parseInt(rounds), timePerRound: parseInt(timePerRound), questionsPerRound: parseInt(questionsPerRound) })
            })
            if (response.ok) {
                const data = await response.json()
                setMensaje(` ¡Partida Iniciada! Game ID: ${data.id}`)
            } else {
                setMensaje(' Error al iniciar la partida.')
            }
        } catch (error) { console.error(error) }
    }

    return (
        <div>
            <div>
                <h2>Sala: {room ? room.code : '...'}</h2>
                <h4> Host: {hostPlayer ? hostPlayer.username : '...'}</h4>
                {mensaje && <p>{mensaje}</p>}
            </div>

            <div>
                <div>
                    <h3>Jugadores sin equipo ({unassignedPlayers.length})</h3>
                    {unassignedPlayers.length === 0 ? <p>Todos tienen equipo.</p> : (
                        <ul>
                            {unassignedPlayers.map(p => (
                                <li key={p.id}>
                                    <span>{p.username} {p.id === playerId ? '(Tú)' : ''}</span>
                                    {isHost && p.id !== playerId && (
                                        <button onClick={() => handleKickPlayer(p.id)}>
                                            Expulsar
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <div>
                        <h3> Equipos</h3>
                        {isHost && <button onClick={handleCreateTeam}>+ Nuevo Equipo</button>}
                    </div>

                    {teams.length === 0 ? <p>No hay equipos creados.</p> : (
                        <div>
                            {teams.map(team => {
                                const playersInThisTeam = players.filter(p => p.teamId === team.id)
                                const amIInThisTeam = playersInThisTeam.some(p => p.id === playerId)

                                return (
                                    <div key={team.id}>
                                        <div>
                                            <strong>Equipo #{team.id}</strong>
                                            {isHost && <button onClick={() => handleDeleteTeam(team.id)}>Borrar Equipo</button>}
                                        </div>

                                        <ul>
                                            {playersInThisTeam.length === 0 && <li>Vacío</li>}
                                            {playersInThisTeam.map(p => (
                                                <li key={p.id}>
                                                    <span>{p.username} {p.id === playerId ? '(Tú)' : ''}</span>
                                                    {(isHost || p.id === playerId) && (
                                                        <button onClick={() => handleRemovePlayerFromTeam(team.id, p.id)}>✖</button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        <div>
                                            {isHost && unassignedPlayers.length > 0 && (
                                                <>
                                                    <select
                                                        value={selectedPlayersToAdd[team.id] || ''}
                                                        onChange={(e) => setSelectedPlayersToAdd({ ...selectedPlayersToAdd, [team.id]: e.target.value })}
                                                    >
                                                        <option value="">Seleccionar jugador...</option>
                                                        {unassignedPlayers.map(up => <option key={up.id} value={up.id}>{up.username}</option>)}
                                                    </select>
                                                    <button onClick={() => handleAssignPlayerToTeam(team.id, selectedPlayersToAdd[team.id])}>Meter</button>
                                                </>
                                            )}

                                            {!isHost && !amIInThisTeam && (
                                                <button onClick={() => handleAssignPlayerToTeam(team.id, playerId)}>Unirme a este equipo</button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {isHost && (
                <div>
                    <h3> Configuración de Partida</h3>
                    <div>
                        <label>Rondas:</label>
                        <input type="number" value={rounds} onChange={(e) => setRounds(e.target.value)} />
                        <label>Segundos:</label>
                        <input type="number" value={timePerRound} onChange={(e) => setTimePerRound(e.target.value)} />
                        <label>Preguntas:</label>
                        <input type="number" value={questionsPerRound} onChange={(e) => setQuestionsPerRound(e.target.value)} />
                        <button onClick={handleCreateGame}>
                            Empezar Partida
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}