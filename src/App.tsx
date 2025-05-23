import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "sonner";
import DataEntryForm from "./components/DataEntryForm";
import Dashboard from "./components/Dashboard";
import DataImportExport from "./components/DataImportExport";
import DataManagement from "./components/DataManagement";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-primary text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Fitness Tracker</h1>
            <nav className="mt-4">
              <ul className="flex space-x-4">
                <li>
                  <Link to="/" className="hover:underline">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:underline">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/data-management" className="hover:underline">
                    Data Management
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<DataEntryForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/data-management" element={<DataManagement />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 text-white py-4">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} Fitness Tracker</p>
          </div>
        </footer>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
