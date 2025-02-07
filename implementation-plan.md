# Dashboard Stats Fix Implementation Plan

## Issue
The dashboard stats component is encountering a 405 (Method Not Allowed) error when trying to fetch user profiles. This is happening because:

1. The Supabase RLS policies allow SELECT operations for:
   - Users to view their own profile
   - Admins/managers to view all profiles

2. The current implementation is attempting to use a POST request (as indicated by the comment), which conflicts with the RLS policies that expect GET requests for SELECT operations.

## Solution

1. Modify the DashboardStats.tsx component to:
   - Remove the comment about POST request since we're using SELECT
   - Ensure the user has admin/manager role before querying
   - Add proper error handling for unauthorized access

## Implementation Steps

1. Update the loadStats function in DashboardStats.tsx:
```typescript
async function loadStats() {
  try {
    setLoading(true);

    // First verify admin/manager status
    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', supabase.auth.user()?.id)
      .single();

    if (userError || !currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      throw new Error('Unauthorized access. Admin privileges required.');
    }

    // Get all users (now we know we have admin access)
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .filter('status', 'neq', 'deleted');

    // Rest of the existing code...
  } catch (error) {
    console.error('Error loading stats:', error);
    toast.error(error.message || 'Failed to load dashboard statistics');
  } finally {
    setLoading(false);
  }
}
```

2. Expected Results:
   - The 405 error will be resolved as we're using the correct HTTP method (GET) for SELECT operations
   - Proper authorization check is performed before attempting to fetch all profiles
   - Better error messages for unauthorized access

## Testing
1. Test with admin user - should successfully load all stats
2. Test with regular user - should show unauthorized error
3. Test with manager user - should successfully load all stats

Would you like me to proceed with implementing this solution?