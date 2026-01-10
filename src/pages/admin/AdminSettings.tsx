import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, RefreshCw, Settings } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewSignups: true,
    demoModeEnabled: true,
    minBet: 0.10,
    maxBet: 1000,
    startingBalance: 100,
  });

  const handleSave = () => {
    localStorage.setItem('casinoSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    setSettings({
      maintenanceMode: false,
      allowNewSignups: true,
      demoModeEnabled: true,
      minBet: 0.10,
      maxBet: 1000,
      startingBalance: 100,
    });
    toast.info('Settings reset to defaults');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 lg:w-6 lg:h-6" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure casino settings</p>
      </div>

      <div className="grid gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription className="text-xs">Global application behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Disable access temporarily
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
                <Label className="text-sm">Allow Signups</Label>
                <p className="text-xs text-muted-foreground">
                  Allow new registrations
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
                <Label className="text-sm">Demo Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Allow guest play with demo balance
                </p>
              </div>
              <Switch
                checked={settings.demoModeEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, demoModeEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Betting Limits</CardTitle>
            <CardDescription className="text-xs">Configure betting parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Min Bet ($)</Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={settings.minBet}
                  onChange={(e) =>
                    setSettings({ ...settings, minBet: parseFloat(e.target.value) || 0.10 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Max Bet ($)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.maxBet}
                  onChange={(e) =>
                    setSettings({ ...settings, maxBet: parseInt(e.target.value) || 1000 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Starting Balance ($)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.startingBalance}
                  onChange={(e) =>
                    setSettings({ ...settings, startingBalance: parseInt(e.target.value) || 100 })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            <CardDescription className="text-xs">Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="destructive" className="w-full" disabled>
              Clear All Bet History
            </Button>
            <Button variant="destructive" className="w-full" disabled>
              Reset All Balances
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Disabled for safety. Use Bet History page to clear data.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
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