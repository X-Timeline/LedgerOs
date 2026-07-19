import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import POS from "./pages/POS.jsx";
import Tutorial from "./pages/Tutorial.jsx";
import Inventory from "./pages/Inventory.jsx";
import CapitalCashBook from "./pages/CapitalCashBook.jsx";
import Customers from "./pages/Customers.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Reports from "./pages/Reports.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      <Route path="/join/:token" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/pos" element={<POS />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/capital" element={<CapitalCashBook />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/tutorial" element={<Tutorial />} />
    </Routes>
  );
}
