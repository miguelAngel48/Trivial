

const API_URL = "https://triviaapi.artemrudenko.com"


const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('playerToken')}`,
    'Content-Type': 'application/json'
})

export const roomService = {
    async getRoom(roomId) {
        const response = await fetch(`${API_URL}/rooms/${roomId}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al obtener la sala')
        return response.json()
    },

    async getPlayers(roomId) {
        const response = await fetch(`${API_URL}/rooms/${roomId}/players`, { headers: getHeaders() });
        return response.json();
    },
    async getTeams(roomId) {
        const response = await fetch(`${API_URL}/rooms/${roomId}/teams`, { headers: getHeaders() });
        return response.json();
    },
    async assignPlayerToTeam(roomId, teamId, targetPlayerId) {
        const response = await fetch(`${API_URL}/rooms/${roomId}/teams/${teamId}/players/${targetPlayerId}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Error al asignar jugador');
        return true;
    }
}