import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import StudentInput from './pages/StudentInput';
import TimetablePreview from './pages/TimetablePreview';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<StudentInput />} />
            <Route path="/timetable" element={<TimetablePreview />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'toast-notification',
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155'
            }
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
