// frontend/src/pages/Achievements.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "./components/Layout";
import GamificationDisplay from "./components/GamificationDisplay";

function Achievements() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");

  return (
    <Layout>
      <div className="page-header">
        <button onClick={() => navigate("/dashboard")} className="back-arrow-btn">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Achievements</h1>
          <p className="page-subtitle">Track your progress and unlock badges</p>
        </div>
      </div>

      <GamificationDisplay userId={user_id} />
    </Layout>
  );
}

export default Achievements;