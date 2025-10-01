"use client";

import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import AddManagerModal from '@/components/AddManagerModal';

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

  useEffect(() => {
    fetchManagers();
  }, []);

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
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
            Managers
          </h2>
          <button 
            onClick={handleAddManager}
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: colors.primary }}
          >
            + Add New Manager
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="p-4 rounded-xl shadow-md animate-pulse"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-12 h-6 bg-gray-200 rounded"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
            Managers
          </h2>
          <button 
            onClick={handleAddManager}
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: colors.primary }}
          >
            + Add New Manager
          </button>
        </div>
        <div 
          className="p-8 rounded-xl text-center"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">Error Loading Managers</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchManagers}
              className="px-6 py-2 rounded-lg text-white font-medium"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
          Managers ({managers.length})
        </h2>
        <button 
          onClick={handleAddManager}
          className="px-6 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: colors.primary }}
        >
          + Add New Manager
        </button>
      </div>

      {managers.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>No Managers Found</h3>
            <p className="text-gray-600 mb-4">No managers have been added yet. Add your first manager to get started.</p>
            <button
              onClick={handleAddManager}
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.primary }}
            >
              Add First Manager
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.map((manager) => (
            <div 
              key={manager._id}
              className="p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {manager.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: colors.text }}>
                      {manager.name}
                    </h3>
                    <p className="text-sm" style={{ color: colors.lightText }}>
                      {manager.email}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs" style={{ color: colors.lightText }}>
                        {manager.type}
                      </p>
                      {manager.tempPassword && (
                        <span 
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ 
                            backgroundColor: `${colors.warning}20`,
                            color: colors.warning
                          }}
                        >
                          Temp Password
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="px-3 py-1 rounded-lg text-sm font-medium"
                    style={{ 
                      backgroundColor: `${colors.primary}20`, 
                      color: colors.primary 
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteManager(manager._id, manager.name)}
                    className="px-3 py-1 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
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
        onSuccess={handleManagerAdded}
        colors={colors}
      />
    </div>
  );
}
