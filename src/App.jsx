import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './components/Home'
import RoomDashboard from './components/RoomDashboard'
import GameScreen from './components/GameScreen'
import HistorialScreen from './components/HistorialScreen'
import './App.css'


const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/room/:roomId",
    element: <RoomDashboard />,
  },
  {
    path: "/game/:gameId",
    element: <GameScreen />,
  },
  {
    path: "/historial",
    element: <HistorialScreen />
  }
]);

function App() {
  return (
    <div className="app-container">
      <h1>Trivia Game</h1>
      <RouterProvider router={router} />
    </div>
  )
}

export default App