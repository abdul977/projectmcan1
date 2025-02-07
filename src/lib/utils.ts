import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from '@/lib/supabase'
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function isAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  
  return data.role === 'admin' || data.role === 'manager';
}