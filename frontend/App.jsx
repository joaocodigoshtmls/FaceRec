import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Cadastro from './pages/Cadastro';
import Homepage from './pages/Homepage';
import SalasPage from './pages/Salas';
import NovaSalaPage from './pages/Salas/Nova';
import DadosPage from './pages/Dados';
import RelatoriosPage from './pages/Relatorios';
import MonitoramentoPage from './pages/Monitoramento';
import ChamadaPage from './pages/Chamada';
import PerfilPage from './pages/Perfil';
import Navbar from './Components/Navbar';

function AppRoutes() {
  return (
    <Routes>
      <Route index path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/salas" element={<SalasPage />} />
  <Route path="/salas/nova" element={<NovaSalaPage />} />
      <Route path="/dados" element={<DadosPage />} />
      <Route path="/relatorios" element={<RelatoriosPage />} />
      <Route path="/monitoramento" element={<MonitoramentoPage />} />
      <Route path="/perfil" element={<PerfilPage />} />
  <Route path="/chamada" element={<ChamadaPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  );
}
