import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, RefreshCw } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewSignups: true,
    leaderboardEnabled: true,
    maxPlayersPerRoom: 2,
    aiDifficultyDefault: 'medium',
  });

  const handleSave = () => {
    // In a real app, save to database
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    setSettings({
      maintenanceMode: false,
      allowNewSignups: true,
      leaderboardEnabled: true,
      maxPlayersPerRoom: 2,
      aiDifficultyDefault: 'medium',
    });
    toast.info('Settings reset to defaults');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure global application behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the application
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow New Signups</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to create accounts
                </p>
              </div>
              <Switch
                checked={settings.allowNewSignups}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowNewSignups: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Leaderboard Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Show leaderboards in games
                </p>
              </div>
              <Switch
                checked={settings.leaderboardEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, leaderboardEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
            <CardDescription>Configure default game parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Max Players Per Room</Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={settings.maxPlayersPerRoom}
                onChange={(e) =>
                  setSettings({ ...settings, maxPlayersPerRoom: parseInt(e.target.value) || 2 })
                }
                className="w-32"
              />
            </div>

            <div className="space-y-2">
              <Label>Default AI Difficulty</Label>
              <select
                value={settings.aiDifficultyDefault}
                onChange={(e) =>
                  setSettings({ ...settings, aiDifficultyDefault: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="destructive" className="w-full" disabled>
              Clear All Game Data
            </Button>
            <Button variant="destructive" className="w-full" disabled>
              Reset All Leaderboards
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              These actions are disabled for safety. Contact system administrator.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
