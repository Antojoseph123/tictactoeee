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
import { Search, Ban, Edit, Loader2, Users } from 'lucide-react';

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
}

const AdminUsers = () => {
  const { isAdmin } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [newUsername, setNewUsername] = useState('');
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

          return {
            ...profile,
            role: (roleData?.role as AppRole) || 'user',
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
        <p className="text-muted-foreground text-sm">Manage players and roles</p>
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
                    <TableHead className="hidden sm:table-cell">Games</TableHead>
                    <TableHead className="hidden md:table-cell">W/L/D</TableHead>
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
                      <TableCell className="hidden sm:table-cell text-sm">{user.games_played}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        <span className="text-green-400">{user.wins}</span>/
                        <span className="text-red-400">{user.losses}</span>/
                        <span className="text-muted-foreground">{user.draws}</span>
                      </TableCell>
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
                                onClick={() => handleEditUser(user)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleBan(user)}
                                className={`h-8 w-8 p-0 ${user.is_banned ? 'text-green-400' : 'text-destructive'}`}
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
    </div>
  );
};

export default AdminUsers;