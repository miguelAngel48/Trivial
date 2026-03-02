import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './../GameScreen.css'

export default function GameScreen() {
    const { gameId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { roomId, playerId } = location.state || {}

    const [rounds, setRounds] = useState([])
    const [currentRound, setCurrentRound] = useState(null)
    const [questions, setQuestions] = useState([])
    const [message, setMessage] = useState('Cargando partida...')
    const [textAnswers, setTextAnswers] = useState({})
    const [submittedAnswers, setSubmittedAnswers] = useState({})
    const [timeLeft, setTimeLeft] = useState(0)
    const [roundOver, setRoundOver] = useState(false)
    const [totalScore, setTotalScore] = useState({})
    const [gameFinished, setGameFinished] = useState(false)
    const [questionsHistory, setQuestionsHistory] = useState([])
    const [namesDictionary, setNamesDictionary] = useState({})
    const [isPaused, setIsPaused] = useState(false)

    const API_URL = 'https://triviaapi.artemrudenko.com'
    const token = localStorage.getItem('playerToken')
    const timerRef = useRef(null)

    const getHeaders = () => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    })

    useEffect(() => {
        if (!token) { navigate('/'); return; }
        loadGameStructure()
        getRoomPlayerNames()
    }, [gameId])

    useEffect(() => {
        if (!currentRound || gameFinished || isPaused) return;

        timerRef.current = setInterval(() => {
            const now = new Date().getTime()
            const end = new Date(currentRound.endedAt).getTime()
            const diff = Math.floor((end - now) / 1000)

            if (diff > 0) {
                setTimeLeft(diff)
                setRoundOver(false)
            } else {
                setTimeLeft(0)
                setRoundOver(true)
                clearInterval(timerRef.current)
            }
        }, 1000)

        return () => clearInterval(timerRef.current)
    }, [currentRound, gameFinished, isPaused])

    useEffect(() => {
        if (roundOver && !gameFinished) {
            setIsPaused(true)

            const delayResults = setTimeout(() => {
                getRoundResults()
            }, 1500)

            const delayNextRound = setTimeout(() => {
                setIsPaused(false)
                goToNextRound()
            }, 8000)

            return () => {
                clearTimeout(delayResults)
                clearTimeout(delayNextRound)
            }
        }
    }, [roundOver])

    const getRoomPlayerNames = async () => {
        try {
            const res = await fetch(`${API_URL}/rooms/${roomId}/players`, { headers: getHeaders() })
            const players = await res.json()
            const map = {}
            players.forEach(p => { map[p.id] = p.username })
            setNamesDictionary(map)
        } catch (e) { console.error(e) }
    }

    const loadGameStructure = async () => {
        try {
            const res = await fetch(`${API_URL}/games/${gameId}/rounds`, { headers: getHeaders() })
            const roundsData = await res.json()
            setRounds(roundsData)
            determineActiveRound(roundsData)
        } catch (e) { setMessage("Error al conectar con el servidor") }
    }

    const determineActiveRound = (roundsList) => {
        const now = new Date()
        const active = roundsList.find(r => new Date(r.endedAt) > now)
        if (active) {
            setCurrentRound(active)
            loadRoundQuestions(active.id)
        } else {
            finishGameCompletely()
        }
    }

    const loadRoundQuestions = async (roundId) => {
        try {
            const res = await fetch(`${API_URL}/games/${gameId}/rounds/${roundId}/questions`, { headers: getHeaders() })
            if (res.ok) {
                const data = await res.json()
                setQuestions(data)
                setMessage('')
                setSubmittedAnswers({})
                setRoundOver(false)
            }
        } catch (e) { console.error(e) }
    }

    const submitAnswer = async (questionId, text) => {
        if (!text || isPaused) return
        try {
            const res = await fetch(`${API_URL}/games/${gameId}/rounds/${currentRound.id}/questions/${questionId}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ answer: text })
            })
            if (res.ok) setSubmittedAnswers(prev => ({ ...prev, [questionId]: true }))
        } catch (e) { console.error(e) }
    }

    const getRoundResults = async () => {
        try {
            const resQ = await fetch(`${API_URL}/games/${gameId}/rounds/${currentRound.id}/questions`, { headers: getHeaders() })
            if (!resQ.ok) return;
            const questionsWithCorrect = await resQ.json()
            setQuestionsHistory(prev => [...prev, ...questionsWithCorrect])

            let newScores = { ...totalScore }
            for (const q of questionsWithCorrect) {
                const resA = await fetch(`${API_URL}/games/${gameId}/rounds/${currentRound.id}/questions/${q.id}`, { headers: getHeaders() })
                if (resA.ok) {
                    const playerAnswers = await resA.json()
                    playerAnswers.forEach(ans => {
                        if (q.correctAnswers.includes(ans.answer)) {
                            newScores[ans.playerId] = (newScores[ans.playerId] || 0) + 1
                        }
                    })
                }
            }
            setTotalScore(newScores)
        } catch (e) { console.error(e) }
    }

    const goToNextRound = () => {
        const now = new Date()
        const next = rounds.find(r => new Date(r.endedAt) > now && r.id !== currentRound.id)
        if (next) {
            setCurrentRound(next)
            loadRoundQuestions(next.id)
        } else {
            finishGameCompletely()
        }
    }

    const finishGameCompletely = () => {
        setGameFinished(true)
        setMessage('')
        const historialGuardado = JSON.parse(localStorage.getItem('historialTrivia') || '[]')

        const nuevaPartida = {
            fecha: new Date().toLocaleString(),
            puntuaciones: totalScore,
            nombres: namesDictionary
        }

        historialGuardado.push(nuevaPartida)
        localStorage.setItem('historialTrivia', JSON.stringify(historialGuardado))
    }

    const exitToHome = () => {

        localStorage.removeItem('playerToken');
        navigate('/');
    }

    if (message) return <h3 className="mensajeCargaJuego">{message}</h3>

    if (gameFinished) {
        return (
            <div className="contenedorJuego textoCentrado">
                <h1 className="textoVerde"> ¡Partida Finalizada!</h1>
                <div className="contenedorRanking">
                    <h3> Clasificación Global</h3>
                    {Object.entries(totalScore).length > 0 ? (
                        Object.entries(totalScore)
                            .sort(([, a], [, b]) => b - a)
                            .map(([id, pts], index) => (
                                <p key={id} className="itemRanking">
                                    {index + 1}. {namesDictionary[id] || `Jugador ${id}`}: <strong>{pts} pts</strong>
                                </p>
                            ))
                    ) : (
                        <p>No se registraron puntuaciones.</p>
                    )}
                </div>
                <div className="seccionResultadosFinales">
                    <h3> Resumen de Respuestas Correctas</h3>
                    {questionsHistory.map((q, i) => (
                        <div key={i} className="tarjetaRespuestaCorrecta">
                            <p><strong>{q.question}</strong></p>
                            <p className="textoVerde">✓ {q.correctAnswers.join(', ')}</p>
                        </div>
                    ))}
                </div>
                <div className="contenedorSalida">
                    <button onClick={exitToHome} className="botonPeligro">Salir al Inicio</button>
                </div>
            </div>
        )
    }

    return (
        <div className="contenedorJuego">
            <div className="cabeceraJuego">
                <h2>{isPaused ? "Resultados de la Ronda" : "Partida en curso"}</h2>
                {!isPaused && (
                    <h2 className={`temporizadorJuego ${timeLeft <= 5 ? 'temporizadorAlerta' : ''}`}>
                        {timeLeft}s
                    </h2>
                )}
            </div>

            {isPaused ? (
                <div className="contenedorRanking textoCentrado">
                    <h2 className="textoVerde">¡Tiempo agotado!</h2>
                    <h3>Puntuaciones actuales:</h3>
                    {Object.entries(totalScore).map(([id, pts]) => (
                        <p key={id}>{namesDictionary[id] || `Jugador ${id}`}: <strong>{pts} pts</strong></p>
                    ))}
                    <p className="mensajeTransicion">La siguiente ronda empezará automáticamente...</p>
                </div>
            ) : (
                <div className="listaPreguntas">
                    {questions.map((player, index) => (
                        <div key={player.id} className={`tarjetaPregunta ${submittedAnswers[player.id] ? 'preguntaEnviada' : ''}`}>
                            <p><strong>{index + 1}. {player.question}</strong></p>
                            <div className="seccionRespuesta">
                                {submittedAnswers[player.id] ? (
                                    <span className="textoVerde">Respuesta enviada </span>
                                ) : (
                                    player.type === 'Multiple Choice' ? (
                                        <div className="contenedorOpciones">
                                            {player.options.map((options, index) => (
                                                <button key={index} className="botonOpcion" onClick={() => submitAnswer(player.id, options)}>{options}</button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="contenedorEntradaTexto">
                                            <input type="text" className="entradaTexto" onChange={(e) => setTextAnswers({ ...textAnswers, [player.id]: e.target.value })} />
                                            <button className="botonEnviar" onClick={() => submitAnswer(player.id, textAnswers[player.id])}>Enviar</button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}