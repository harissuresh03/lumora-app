// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Journal from "./pages/Journal";
import MentalHealthArticle from "./pages/MentalHealthArticle"; 
import StudentSupport from "./pages/StudentSupport";           

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/mental-health" element={<MentalHealthArticle />} />     
        <Route path="/student-support" element={<StudentSupport />} />       
      </Routes>
    </Router>
  );
}

export default App;