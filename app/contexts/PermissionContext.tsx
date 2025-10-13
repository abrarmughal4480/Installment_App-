import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/apiService';

interface Permissions {
  canViewData: boolean;
  canAddData: boolean;
  isMainAdmin: boolean;
  grantedBy?: string;
  grantedAt?: string;
}

interface PermissionContextType {
  permissions: Permissions | null;
  isLoading: boolean;
  loadPermissions: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  hasViewPermission: () => boolean;
  hasAddPermission: () => boolean;
  isMainAdmin: () => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading permissions...');
      
      // First get user profile to check if main admin
      const profileResponse = await apiService.getProfile();
      console.log('📋 Profile response:', profileResponse);
      
      if (profileResponse.success && profileResponse.user) {
        const user = profileResponse.user;
        console.log('👤 Current user:', user.email, user.type);
        
        // Check if main admin
        if (user.type === 'admin' && user.email === 'installmentadmin@app.com') {
          console.log('🔑 Main admin detected - granting full permissions');
          setPermissions({
            canViewData: true,
            canAddData: true,
            isMainAdmin: true
          });
          setIsLoading(false);
          return;
        } else {
          console.log('👤 Regular admin user - will fetch permissions from API');
        }
      } else {
        console.log('❌ Failed to get user profile:', profileResponse);
        throw new Error('Failed to get user profile');
      }
      
      // For non-main admin users, get permissions from API
      console.log('📡 Fetching permissions from API...');
      console.log('📡 About to call apiService.getMyPermissions()...');
      const response = await apiService.getMyPermissions();
      console.log('📡 getMyPermissions call completed');
      
      console.log('📡 getMyPermissions response:', response);
      
      if (response.success) {
        console.log('✅ Permissions loaded:', response.permissions);
        setPermissions(response.permissions);
      } else {
        console.error('❌ Failed to load permissions:', response);
        // Set default permissions for non-admin users
        setPermissions({
          canViewData: false,
          canAddData: false,
          isMainAdmin: false
        });
      }
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
      // Set default permissions on error
      setPermissions({
        canViewData: false,
        canAddData: false,
        isMainAdmin: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasViewPermission = (): boolean => {
    const result = permissions?.canViewData === true || permissions?.isMainAdmin === true;
    console.log('🔍 hasViewPermission check:', {
      permissions,
      canViewData: permissions?.canViewData,
      isMainAdmin: permissions?.isMainAdmin,
      result
    });
    return result;
  };

  const hasAddPermission = (): boolean => {
    const result = permissions?.canAddData === true || permissions?.isMainAdmin === true;
    console.log('🔍 hasAddPermission check:', {
      permissions,
      canAddData: permissions?.canAddData,
      isMainAdmin: permissions?.isMainAdmin,
      result
    });
    return result;
  };

  const isMainAdmin = (): boolean => {
    return permissions?.isMainAdmin === true;
  };

  const refreshPermissions = async () => {
    console.log('🔄 Refreshing permissions...');
    // Force reset permissions first
    setPermissions(null);
    setIsLoading(true);
    await loadPermissions();
    console.log('✅ Permissions refreshed');
  };

  useEffect(() => {
    console.log('🚀 PermissionContext useEffect triggered - loading permissions');
    loadPermissions();
  }, []);

  const value: PermissionContextType = {
    permissions,
    isLoading,
    loadPermissions,
    refreshPermissions,
    hasViewPermission,
    hasAddPermission,
    isMainAdmin
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
