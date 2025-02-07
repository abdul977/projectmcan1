import { useState, useEffect } from 'react';
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
import { ChevronDown, ChevronUp, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: 'pending' | 'active' | 'approved' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
  receipt_path: string | null;
  amount_paid: number | null;
  profiles: { full_name: string; email: string; };
  rooms: { number: string; type: string; };
}

const BookingsManagement = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: 'id',
      header: 'Booking ID',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue('id')}</span>
      ),
    },
    {
      accessorKey: 'profiles.full_name',
      header: 'Guest Name',
    },
    {
      accessorKey: 'rooms.number',
      header: 'Room',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">Room {row.original.rooms?.number || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.original.rooms?.type || 'N/A'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'check_in_date',
      header: 'Check In',
      cell: ({ row }) => new Date(row.getValue('check_in_date')).toLocaleDateString(),
    },
    {
      accessorKey: 'check_out_date',
      header: 'Check Out',
      cell: ({ row }) => new Date(row.getValue('check_out_date')).toLocaleDateString(),
    },
    {
      accessorKey: 'total_price',
      header: 'Price',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('total_price'));
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
        }).format(amount);
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === 'active'
                ? 'bg-green-100 text-green-800'
                : status === 'approved'
 || status === 'confirmed'
                ? 'bg-blue-100 text-blue-800'
                : status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment',
      cell: ({ row }) => {
        const status = row.getValue('payment_status') as string;
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === 'paid'
                ? 'bg-green-100 text-green-800'
                : status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {status}
          </span>
        );
      },
    }
  ];

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          room_id,
          check_in_date,
          check_out_date,
          total_price,
          status,
          payment_status,
          created_at,
          updated_at,
          receipt_path,
          amount_paid,
          guest:profiles!user_id (
            full_name,
            email
          ),
          room:rooms!room_id (
            number,
            type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      console.log('Raw data from database:', data);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      const transformedData = (data || [] as any[])
        .filter(booking => ['active', 'approved', 'confirmed', 'pending'].includes(booking.status))
        .map(booking => ({
          ...booking,
          'profiles.full_name': booking.guest?.full_name || 'N/A',
          'profiles.email': booking.guest?.email || 'N/A',
          'rooms.number': booking.room?.number || 'N/A',
          'rooms.type': booking.room?.type || 'N/A'
        }));
        
      console.log('Transformed bookings:', transformedData);

      setBookings(transformedData);
      toast.success(`Loaded ${transformedData.length} bookings`);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  const table = useReactTable({
    data: bookings,
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

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Active Bookings</h3>
            <p className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'active').length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.payment_status === 'pending').length}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Bookings Management</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBookings}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Filter by guest name..."
              value={(table.getColumn('profiles.full_name')?.getFilterValue() as string) ?? ''}
              onChange={(e) =>
                table.getColumn('profiles.full_name')?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={(table.getColumn('payment_status')?.getFilterValue() as string) ?? 'all'}
              onValueChange={(value) =>
                table.getColumn('payment_status')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    onClick={() => console.log('Booking details:', row.original)}
                    data-state={row.getIsSelected() && "selected"}
                    className={`${
                      row.getValue('status') === 'active'
                        ? 'bg-green-50'
                        : row.getValue('status') === 'approved'
                        ? 'bg-blue-50'
                        : row.getValue('status') === 'confirmed'
                        ? 'bg-blue-50'
                        : row.getValue('status') === 'pending'
                        ? 'bg-yellow-50'
                        : 'bg-white'
                    }
                    hover:bg-opacity-90 transition-all
                    ${
                      row.getValue('payment_status') === 'paid'
                        ? 'border-l-4 border-green-400'
                        : ''
                    }
                    transition-colors cursor-pointer hover:bg-opacity-75`}
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
                    No bookings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 mt-4">
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
      </div>
    </div>
  );
}
;

export default BookingsManagement;
