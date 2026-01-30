
import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import AiCoach from "./pages/AiCoach";
import Layout from "./components/Layout";
// Марафоны
import MarathonEntry from "./pages/MarathonEntry";
import MarathonDashboard from "./pages/MarathonDashboard";
import MarathonTests from "./pages/MarathonTests";
// Админка
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import api from "./api";

// Компонент-обертка для проверки авторизации (обычный юзер)
const AuthCheck = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await api.get('/check-user');
        if (res.data.isOnboarded) {
          navigate('/home', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } catch (e) {
        console.error("Auth check failed", e);
        navigate('/onboarding', { replace: true });
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--ios-bg)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[var(--ios-blue)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Корневой маршрут теперь проверяет юзера */}
      <Route path="/" element={<AuthCheck />} />
      
      {/* Регистрация вынесена на отдельный путь */}
      <Route path="/onboarding" element={<Onboarding />} />
      
      <Route path="/scanner" element={<Scanner />} />
      
      {/* Марафоны */}
      <Route path="/marathon/entry" element={<MarathonEntry />} />
      <Route path="/marathon/dashboard" element={<MarathonDashboard />} />
      <Route path="/marathon/tests" element={<MarathonTests />} />

      {/* Админка (Shadow Gate) */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* Основной Layout для защищенных страниц */}
      <Route element={<Layout />}>
         <Route path="/home" element={<Home />} />
         <Route path="/achievements" element={<Achievements />} />
         <Route path="/ai-coach" element={<AiCoach />} />
         <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
