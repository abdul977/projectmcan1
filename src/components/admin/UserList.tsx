import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { sendEmail, EmailTemplate } from '@/lib/notifications';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  full_name: string;
  email: string;
  status: 'active' | 'disabled' | 'deleted';
  role: 'user' | 'admin' | 'manager';
  created_at: string;
}

export function UserList() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.status === 'active'
              ? 'bg-green-100 text-green-800'
              : row.original.status === 'disabled'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.role}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Joined
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return new Date(row.original.created_at).toLocaleDateString();
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/users/${user.id}`)}
            >
              Details
            </Button>
            <Button
              variant={user.status === 'active' ? 'destructive' : 'primary'}
              size="sm"
              onClick={() => handleStatusToggle(user)}
            >
              {user.status === 'active' ? 'Disable' : 'Enable'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setShowDeleteDialog(true);
              }}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      // Use POST method with filter to get users
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusToggle(user: User) {
    try {
      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          status: newStatus,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Send email notification
      await sendEmail(EmailTemplate.ACCOUNT_STATUS_CHANGE, user.email, {
        userName: user.full_name,
        status: newStatus,
      });

      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));

      toast.success(`User ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: selectedUser.id,
          status: 'deleted',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Send email notification
      await sendEmail(EmailTemplate.ACCOUNT_STATUS_CHANGE, selectedUser.email, {
        userName: selectedUser.full_name,
        status: 'deleted',
      });

      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, status: 'deleted' } : u
      ));

      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search users..."
            value={(table.getColumn('full_name')?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn('full_name')?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <Select
          value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}