import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data) {
        setUserProfile({
          id: data.id,
          fullName: data.full_name,
          role: data.role,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          classId: data.class_id,
          avatarUrl: data.avatar_url,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await loadUserProfile(currentUser.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            await loadUserProfile(currentUser.id);
          } else {
            setUserProfile(null);
          }
          
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase || !user || !userProfile) return;
    
    try {
      const updateData: any = {};
      if (updates.fullName) updateData.full_name = updates.fullName;
      if (updates.role) updateData.role = updates.role;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.department !== undefined) updateData.department = updates.department;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.classId !== undefined) updateData.class_id = updates.classId;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userProfile) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userProfile.role);
    }
    
    return userProfile.role === role;
  };

  const isAdmin = hasRole('administrator');

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signOut,
      updateUserProfile,
      hasRole,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};