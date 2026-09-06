// frontend/src/pages/components/ExportButton.js
import React, { useState } from "react";
import { Download, FileText, Calendar, Moon, Activity, FileSpreadsheet } from "lucide-react";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "./ToastNotification";

function ExportButton({ 
  type, 
  userId, 
  label = "Export", 
  icon = <Download size={16} />,
  month = null,
  year = null,
  assessmentId = null,
  studentId = null,
  variant = "primary"  // Default is primary (purple)
}) {
  const [loading, setLoading] = useState(false);

  const getEndpoint = () => {
    switch(type) {
      case 'journal':
        return `/student-export/journal/${userId}/pdf`;
      case 'mood':
        return `/student-export/mood/${userId}/csv`;
      case 'sleep':
        return `/student-export/sleep/${userId}/csv`;
      case 'assessment':
        return `/student-export/assessment/${assessmentId}/pdf`;
      case 'appointments':
        return `/student-export/appointments/${userId}/csv`;
      case 'counsellor-students':
        return `/counsellor-export/students/${userId}/csv`;
      case 'counsellor-appointments':
        return `/counsellor-export/appointments/${userId}/csv`;
      case 'counsellor-analytics':
        return `/counsellor-export/analytics/${userId}/csv`;
      case 'counsellor-student-progress':
        return `/counsellor-export/student-progress/${studentId}/${userId}/csv`;
      default:
        return null;
    }
  };

  const getFilename = () => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    
    switch(type) {
      case 'journal':
        return `journal_entries_${dateStr}.pdf`;
      case 'mood':
        return `mood_history_${dateStr}.csv`;
      case 'sleep':
        return `sleep_logs_${dateStr}.csv`;
      case 'assessment':
        return `assessment_result_${assessmentId}_${dateStr}.pdf`;
      case 'appointments':
        return `appointments_${dateStr}.csv`;
      default:
        return `export_${dateStr}`;
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'journal':
        return <FileText size={16} />;
      case 'mood':
        return <Activity size={16} />;
      case 'sleep':
        return <Moon size={16} />;
      case 'assessment':
        return <Activity size={16} />;
      case 'appointments':
        return <Calendar size={16} />;
      default:
        return <FileSpreadsheet size={16} />;
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const endpoint = getEndpoint();
      if (!endpoint) {
        showErrorToast("Invalid export type");
        setLoading(false);
        return;
      }

      const url = new URL(endpoint, 'http://localhost:5000/api');
      
      if (type === 'journal' && month && year) {
        url.searchParams.append('month', month);
        url.searchParams.append('year', year);
      }

      const response = await api.get(url.pathname + url.search, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showSuccessToast(`${label} downloaded successfully!`);
    } catch (err) {
      console.error("Export error:", err);
      if (err.response?.status === 404) {
        showErrorToast("No data found to export");
      } else {
        showErrorToast("Failed to export data");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Purple theme styles
  const getVariantStyles = () => {
    switch(variant) {
      case 'primary':
        return {
          background: '#7c3aed',  // Purple
          color: 'white',
          border: 'none'
        };
      case 'secondary':
        return {
          background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-light)'
        };
      case 'dark':
        return {
          background: '#1e293b',
          color: 'white',
          border: '1px solid #334155'
        };
      case 'outline':
        return {
          background: 'transparent',
          color: '#7c3aed',
          border: '1px solid #7c3aed'
        };
      default:
        return {
          background: '#7c3aed',  // Default purple
          color: 'white',
          border: 'none'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '30px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.25s ease',
        ...styles
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = '#8b5cf6';  // Light purple on hover
          e.currentTarget.style.color = 'white'; 
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
          if (variant === 'outline') {
            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          const originalStyles = getVariantStyles();
          e.currentTarget.style.background = originalStyles.background;
          e.currentTarget.style.color = originalStyles.color; 
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          if (variant === 'outline') {
            e.currentTarget.style.background = 'transparent';
          }
        }
      }}
      onMouseDown={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'scale(0.95)';
          e.currentTarget.style.color = 'white';
        }
      }}
      onMouseUp={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
    >
      {loading ? (
        <span className="spinning" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
      ) : (
        icon || getIcon()
      )}
      {loading ? 'Exporting...' : label}
    </button>
  );
}

export default ExportButton;