"use client";

import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import AddManagerModal from '@/components/AddManagerModal';
import EditManagerModal from '@/components/EditManagerModal';

interface ManagersSectionProps {
  colors: any;
}

interface Manager {
  _id: string;
  name: string;
  email: string;
  type: string;
  tempPassword: boolean;
  createdAt: string;
}

export default function ManagersSection({ colors }: ManagersSectionProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEditDropdown, setShowEditDropdown] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [editType, setEditType] = useState<'name' | 'email' | 'password'>('name');

  useEffect(() => {
    fetchManagers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEditDropdown) {
        const target = event.target as Element;
        if (!target.closest('.edit-dropdown')) {
          setShowEditDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditDropdown]);

  const fetchManagers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getManagers();
      
      if (response.success && response.data) {
        // Filter to show only managers with type "manager"
        const filteredManagers = (response.data as Manager[]).filter(manager => manager.type === 'manager');
        setManagers(filteredManagers);
      } else {
        setError(response.message || 'Failed to fetch managers');
      }
    } catch (err) {
      setError('An error occurred while fetching managers');
      console.error('Managers fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManager = () => {
    setIsModalOpen(true);
  };

  const handleManagerAdded = () => {
    fetchManagers(); // Refresh the list
  };

  const handleDeleteManager = async (managerId: string, managerName: string) => {
    if (window.confirm(`Are you sure you want to delete ${managerName}? This action cannot be undone.`)) {
      try {
        const response = await apiService.deleteManager(managerId);
        
        if (response.success) {
          // Refresh the list
          fetchManagers();
        } else {
          setError(response.message || 'Failed to delete manager');
        }
      } catch (err) {
        setError('An error occurred while deleting manager');
        console.error('Delete manager error:', err);
      }
    }
  };

  const toggleEditDropdown = (managerId: string) => {
    setShowEditDropdown(showEditDropdown === managerId ? null : managerId);
  };

  const openEditModal = (manager: Manager, type: 'name' | 'email' | 'password') => {
    setSelectedManager(manager);
    setEditType(type);
    setShowEditModal(true);
    setShowEditDropdown(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedManager(null);
  };

  const handleEditManager = async (data: any) => {
    if (!selectedManager) return;

    try {
      const response = await apiService.updateManager(selectedManager._id, {
        ...data,
        editType: editType
      });
      
      if (response.success) {
        // Refresh the list
        fetchManagers();
        closeEditModal();
      } else {
        setError(response.message || 'Failed to update manager');
      }
    } catch (err) {
      setError('An error occurred while updating manager');
      console.error('Update manager error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: colors.text }}>
            Managers
          </h2>
          <button 
            onClick={handleAddManager}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-white text-sm sm:text-base w-full sm:w-auto"
            style={{ backgroundColor: colors.primary }}
          >
            + Add New Manager
          </button>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="flex-1 min-w-[280px] sm:min-w-[300px] lg:min-w-[320px] max-w-[400px] p-3 sm:p-4 rounded-xl shadow-md animate-pulse overflow-hidden"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-1"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-24 sm:w-32 mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="flex space-x-1 sm:space-x-2 justify-end">
                  <div className="w-10 sm:w-12 h-5 sm:h-6 bg-gray-200 rounded"></div>
                  <div className="w-12 sm:w-16 h-5 sm:h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: colors.text }}>
            Managers
          </h2>
          <button 
            onClick={handleAddManager}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-white text-sm sm:text-base w-full sm:w-auto"
            style={{ backgroundColor: colors.primary }}
          >
            + Add New Manager
          </button>
        </div>
        <div 
          className="p-4 sm:p-6 lg:p-8 rounded-xl text-center"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Error Loading Managers</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchManagers}
              className="px-4 sm:px-6 py-2 rounded-lg text-white font-medium text-sm sm:text-base"
              style={{ backgroundColor: colors.primary }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: colors.text }}>
          Managers ({managers.length})
        </h2>
        <button 
          onClick={handleAddManager}
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-white text-sm sm:text-base w-full sm:w-auto"
          style={{ backgroundColor: colors.primary }}
        >
          + Add New Manager
        </button>
      </div>

      {managers.length === 0 ? (
        <div 
          className="p-4 sm:p-6 lg:p-8 rounded-xl text-center"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: colors.text }}>No Managers Found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">No managers have been added yet. Add your first manager to get started.</p>
            <button
              onClick={handleAddManager}
              className="px-4 sm:px-6 py-2 rounded-lg text-white font-medium text-sm sm:text-base"
              style={{ backgroundColor: colors.primary }}
            >
              Add First Manager
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {managers.map((manager) => (
            <div 
              key={manager._id}
              className="flex-1 min-w-[280px] sm:min-w-[300px] lg:min-w-[320px] max-w-[400px] p-3 sm:p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {manager.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-semibold text-sm sm:text-base truncate mb-1" style={{ color: colors.text }}>
                      {manager.name}
                    </h3>
                    <p className="text-xs sm:text-sm truncate mb-1" style={{ color: colors.lightText }}>
                      {manager.email}
                    </p>
                    <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                      <p className="text-xs" style={{ color: colors.lightText }}>
                        {manager.type}
                      </p>
                      {manager.tempPassword && (
                        <span 
                          className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                          style={{ 
                            backgroundColor: `${colors.warning}20`,
                            color: colors.warning
                          }}
                        >
                          Temp
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1 sm:space-x-2 justify-end">
                  <div className="relative edit-dropdown">
                    <button 
                      onClick={() => toggleEditDropdown(manager._id)}
                      className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1"
                      style={{ 
                        backgroundColor: `${colors.primary}20`, 
                        color: colors.primary 
                      }}
                    >
                      Edit
                      <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Edit Dropdown */}
                    {showEditDropdown === manager._id && (
                      <div className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border z-50">
                        <div className="py-1">
                          <button
                            onClick={() => openEditModal(manager, 'name')}
                            className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Edit Name
                          </button>
                          <button
                            onClick={() => openEditModal(manager, 'email')}
                            className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Edit Email
                          </button>
                          <button
                            onClick={() => openEditModal(manager, 'password')}
                            className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Reset Password
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteManager(manager._id, manager.name)}
                    className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{ 
                      backgroundColor: `${colors.danger}20`, 
                      color: colors.danger 
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AddManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleManagerAdded}
        colors={colors}
      />

      <EditManagerModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        onSubmit={handleEditManager}
        manager={selectedManager}
        editType={editType}
        colors={colors}
      />
    </div>
  );
}
