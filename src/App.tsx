
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TrackingEvents from './pages/TrackingEvents';
import StatusConfirm from './pages/StatusConfirm';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import "./App.css";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tracking-events" element={<TrackingEvents />} />
          <Route path="/status-confirm" element={<StatusConfirm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster richColors position="bottom-center" />
    </>
  );
}

export default App;
