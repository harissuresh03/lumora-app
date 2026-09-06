// frontend/src/pages/Admin/AdminResources.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { Plus, Edit, Trash2, Globe, Phone } from "lucide-react";

function AdminResources() {
  const [resources, setResources] = useState({
    onlineResources: [],
    crisisResources: []
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    type: 'online_resource',
    name: '',
    number: '',
    url: '',
    description: '',
    hours: '',
    display_order: 0
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await api.get("/admin/resources");
      setResources({
        onlineResources: res.data.onlineResources || [],
        crisisResources: res.data.crisisResources || []
      });
    } catch (err) {
      console.error("Fetch resources error:", err);
      showErrorToast("Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResource = async () => {
    try {
      if (editingResource) {
        await api.put(`/admin/resources/${editingResource.id}`, formData);
        showSuccessToast("Resource updated successfully");
      } else {
        await api.post("/admin/resources", formData);
        showSuccessToast("Resource added successfully");
      }
      setShowModal(false);
      setEditingResource(null);
      setFormData({
        type: 'online_resource',
        name: '',
        number: '',
        url: '',
        description: '',
        hours: '',
        display_order: 0
      });
      fetchResources();
    } catch (err) {
      showErrorToast("Failed to save resource");
    }
  };

  const handleDeleteResource = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await api.delete(`/admin/resources/${id}`);
        showSuccessToast("Resource deleted successfully");
        fetchResources();
      } catch (err) {
        showErrorToast("Failed to delete resource");
      }
    }
  };

  const openEditModal = (resource, type) => {
    setEditingResource(resource);
    setFormData({
      type: type,
      name: resource.name || '',
      number: resource.number || '',
      url: resource.url || '',
      description: resource.description || '',
      hours: resource.hours || '',
      display_order: resource.display_order || 0
    });
    setShowModal(true);
  };

  const resourceSections = [
    { 
      key: 'onlineResources', 
      title: 'Online Resources', 
      icon: <Globe size={20} />, 
      color: '#3b82f6',
      type: 'online_resource',
      fields: ['name', 'url', 'description']
    },
    { 
      key: 'crisisResources', 
      title: 'Crisis Resources', 
      icon: <Phone size={20} />, 
      color: '#ef4444',
      type: 'crisis_resource',
      fields: ['name', 'number', 'description', 'hours']
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading resources...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Add Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={() => { setEditingResource(null); setShowModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '40px', color: 'white', cursor: 'pointer' }}
        >
          <Plus size={16} /> Add Resource
        </button>
      </div>

      {/* Online Resources Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid var(--border-glass)'
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6' }}>
          <Globe size={20} /> Online Resources
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {resources.onlineResources.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No online resources found. Add one!</p>
          ) : (
            resources.onlineResources.map((resource) => (
              <div
                key={resource.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div>
                  <strong>{resource.name}</strong>
                  {resource.url && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{resource.url}</div>}
                  {resource.description && <div style={{ fontSize: '13px', marginTop: '4px' }}>{resource.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(resource, 'online_resource')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}>
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteResource(resource.id, 'Online Resource')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Crisis Resources Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-glass)',
          marginBottom: '24px'
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
          <Phone size={20} /> Crisis Resources
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {resources.crisisResources.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No crisis resources found. Add one!</p>
          ) : (
            resources.crisisResources.map((resource) => (
              <div
                key={resource.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div>
                  <strong>{resource.name}</strong>
                  {resource.number && <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>{resource.number}</div>}
                  {resource.description && <div style={{ fontSize: '13px', marginTop: '4px' }}>{resource.description}</div>}
                  {resource.hours && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🕐 {resource.hours}</div>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(resource, 'crisis_resource')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}>
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteResource(resource.id, 'Crisis Resource')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="input-group">
                <label className="input-label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="online_resource">Online Resource</option>
                  <option value="crisis_resource">Crisis Resource</option>
                </select>
              </div>
              
              <div className="input-group">
                <label className="input-label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Resource name"
                  required
                />
              </div>
              
              {formData.type === 'online_resource' ? (
                <div className="input-group">
                  <label className="input-label">URL *</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div className="input-group">
                  <label className="input-label">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 15999"
                  />
                </div>
              )}
              
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="peer-textarea"
                  rows="3"
                  placeholder="Resource description"
                />
              </div>
              
              {formData.type === 'crisis_resource' && (
                <div className="input-group">
                  <label className="input-label">Hours (Optional)</label>
                  <input
                    type="text"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 24/7, 9am-5pm"
                  />
                </div>
              )}
              
              <div className="modal-actions">
                <button onClick={() => setShowModal(false)} className="peer-btn-secondary">Cancel</button>
                <button onClick={handleSaveResource} className="peer-btn-primary">Save Resource</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminResources;