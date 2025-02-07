import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { isAdmin } from '@/lib/utils';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminUser(false);
        setLoading(false);
        return;
      }

      const adminStatus = await isAdmin(user.id);
      setIsAdminUser(adminStatus);
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  return { isAdminUser, loading };
}