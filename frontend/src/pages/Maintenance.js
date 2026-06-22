// frontend/src/pages/Maintenance.js
import React from "react";
import { Wrench } from "lucide-react";

function Maintenance() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--card-bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '28px',
        padding: '48px',
        maxWidth: '500px',
        textAlign: 'center',
        border: '1px solid var(--border-glass)'
      }}>
        <Wrench size={64} style={{ marginBottom: '20px', color: 'var(--accent-primary)' }} />
        <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>Under Maintenance</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          We're currently improving the system. Please check back soon!
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Expected downtime: 5-10 minutes
        </p>
      </div>
    </div>
  );
}

export default Maintenance;