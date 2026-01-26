
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import About from './pages/About';
import ProtectedRoute from './components/ProtectedRoute';
import Encyclopedia from './pages/Encyclopedia';
import Profile from './pages/Profile';
import Missions from './pages/Missions';
import Community from './pages/Community';
import AdminDashboard from './pages/AdminDashboard';
import NewsDetail from './pages/NewsDetail';
import NewsArchive from './pages/NewsArchive';
import { GamificationProvider } from './contexts/GamificationContext';
import { SoundscapeProvider } from './contexts/SoundscapeContext';



function App() {
  return (
    <GamificationProvider>
      <SoundscapeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="news" element={<NewsArchive />} />
                <Route path="news/:id" element={<NewsDetail />} />
                <Route path="missions" element={<Missions />} />
                <Route path="encyclopedia" element={<Encyclopedia />} />
                <Route path="community" element={<Community />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </SoundscapeProvider>
    </GamificationProvider>
  );
}

export default App;
