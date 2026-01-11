import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Ban, Edit, Loader2, Users, Wallet, Plus, Minus } from 'lucide-react';

interface UserWithRole {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  is_banned: boolean;
  created_at: string;
  role?: AppRole;
  balance?: number;
}

const AdminUsers = () => {
  const { isAdmin } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [newUsername, setNewUsername] = useState('');
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .single();

          // Fetch balance - admins can view all balances via service role in edge function
          // For now we'll use a workaround by checking if balance exists
          const { data: balanceData } = await supabase
            .from('casino_balances')
            .select('balance')
            .eq('user_id', profile.user_id)
            .single();

          return {
            ...profile,
            role: (roleData?.role as AppRole) || 'user',
            balance: balanceData?.balance ?? 0,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setNewUsername(user.username);
    setEditDialogOpen(true);
  };

  const handleBalanceClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setBalanceAdjustment('');
    setAdjustmentType('add');
    setBalanceDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser || !isAdmin) return;
    setSaving(true);

    try {
      if (newUsername !== selectedUser.username) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username: newUsername })
          .eq('user_id', selectedUser.user_id);

        if (profileError) throw profileError;
      }

      if (newRole !== selectedUser.role) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.user_id, role: newRole });

        if (insertError) throw insertError;
      }

      toast.success('User updated successfully');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !isAdmin) return;
    
    const amount = parseFloat(balanceAdjustment);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    setSaving(true);

    try {
      let newBalance: number;
      const currentBalance = selectedUser.balance || 0;

      switch (adjustmentType) {
        case 'add':
          newBalance = currentBalance + amount;
          break;
        case 'subtract':
          newBalance = Math.max(0, currentBalance - amount);
          break;
        case 'set':
          newBalance = amount;
          break;
        default:
          newBalance = currentBalance;
      }

      // Check if user has a balance record
      const { data: existingBalance } = await supabase
        .from('casino_balances')
        .select('id')
        .eq('user_id', selectedUser.user_id)
        .single();

      if (existingBalance) {
        const { error } = await supabase
          .from('casino_balances')
          .update({ balance: newBalance })
          .eq('user_id', selectedUser.user_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('casino_balances')
          .insert({ user_id: selectedUser.user_id, balance: newBalance });

        if (error) throw error;
      }

      const actionText = adjustmentType === 'add' ? 'added to' : adjustmentType === 'subtract' ? 'removed from' : 'set for';
      toast.success(`$${amount.toLocaleString()} ${actionText} ${selectedUser.username}'s balance`);
      setBalanceDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('Failed to adjust balance. Make sure you have admin privileges.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBan = async (user: UserWithRole) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !user.is_banned })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast.success(user.is_banned ? 'User unbanned' : 'User banned');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling ban:', error);
      toast.error('Failed to update ban status');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-0';
      case 'moderator':
        return 'bg-blue-500/20 text-blue-400 border-0';
      default:
        return 'bg-muted text-muted-foreground border-0';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 lg:w-6 lg:h-6" />
          Player Management
        </h1>
        <p className="text-muted-foreground text-sm">Manage players, roles, and balances</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">All Players</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="hidden md:table-cell">Games</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-sm">{user.username}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role || 'user')}>
                          {user.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleBalanceClick(user)}
                          className="font-mono text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          ${(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </button>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{user.games_played}</TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge variant="destructive" className="text-xs">Banned</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-0">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleBalanceClick(user)}
                                className="h-8 w-8 p-0 text-primary"
                                title="Adjust Balance"
                              >
                                <Wallet className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditUser(user)}
                                className="h-8 w-8 p-0"
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleBan(user)}
                                className={`h-8 w-8 p-0 ${user.is_banned ? 'text-green-400' : 'text-destructive'}`}
                                title={user.is_banned ? 'Unban User' : 'Ban User'}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>
              Update player details and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Adjust Balance
            </DialogTitle>
            <DialogDescription>
              Modify {selectedUser?.username}'s casino balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Balance */}
            <div className="p-4 rounded-lg bg-surface border border-border">
              <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-primary">
                ${(selectedUser?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAdjustmentType('add')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                    adjustmentType === 'add'
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-surface border-border hover:border-border-strong'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
                <button
                  onClick={() => setAdjustmentType('subtract')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                    adjustmentType === 'subtract'
                      ? 'bg-red-500/20 border-red-500/50 text-red-400'
                      : 'bg-surface border-border hover:border-border-strong'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Remove
                </button>
                <button
                  onClick={() => setAdjustmentType('set')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                    adjustmentType === 'set'
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-surface border-border hover:border-border-strong'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  Set
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {adjustmentType === 'add' && 'Amount to Add'}
                {adjustmentType === 'subtract' && 'Amount to Remove'}
                {adjustmentType === 'set' && 'New Balance'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={balanceAdjustment}
                  onChange={(e) => setBalanceAdjustment(e.target.value)}
                  className="pl-7 text-lg font-mono"
                />
              </div>
            </div>

            {/* Preview */}
            {balanceAdjustment && !isNaN(parseFloat(balanceAdjustment)) && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">New Balance Preview</p>
                <p className="text-lg font-bold">
                  ${(() => {
                    const amount = parseFloat(balanceAdjustment);
                    const current = selectedUser?.balance || 0;
                    switch (adjustmentType) {
                      case 'add':
                        return (current + amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
                      case 'subtract':
                        return Math.max(0, current - amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
                      case 'set':
                        return amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
                      default:
                        return current.toLocaleString('en-US', { minimumFractionDigits: 2 });
                    }
                  })()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBalanceAdjustment} 
              disabled={saving || !balanceAdjustment}
              className={
                adjustmentType === 'add' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : adjustmentType === 'subtract' 
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
              }
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {adjustmentType === 'add' && 'Add Funds'}
              {adjustmentType === 'subtract' && 'Remove Funds'}
              {adjustmentType === 'set' && 'Set Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;