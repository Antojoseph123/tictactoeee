import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Dice1, TrendingUp, Bomb, Circle, Spade } from 'lucide-react';

const CASINO_GAMES = [
  {
    id: 'dice',
    name: 'Dice',
    description: 'Roll over or under a target number',
    icon: Dice1,
    houseEdge: '1%',
    status: 'active',
  },
  {
    id: 'crash',
    name: 'Crash',
    description: 'Cash out before the multiplier crashes',
    icon: TrendingUp,
    houseEdge: '4%',
    status: 'active',
  },
  {
    id: 'mines',
    name: 'Mines',
    description: 'Reveal gems, avoid mines',
    icon: Bomb,
    houseEdge: '2%',
    status: 'active',
  },
  {
    id: 'plinko',
    name: 'Plinko',
    description: 'Drop balls through pegs for multipliers',
    icon: Circle,
    houseEdge: '1%',
    status: 'active',
  },
  {
    id: 'roulette',
    name: 'Roulette',
    description: 'Bet on numbers, colors, or ranges',
    icon: Circle,
    houseEdge: '2.7%',
    status: 'active',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Beat the dealer to 21',
    icon: Spade,
    houseEdge: '0.5%',
    status: 'active',
  },
];

const AdminGames = () => {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 lg:w-6 lg:h-6" />
          Game Configuration
        </h1>
        <p className="text-muted-foreground text-sm">Manage casino games and settings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CASINO_GAMES.map((game) => (
          <Card key={game.id} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <game.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{game.name}</CardTitle>
                    <CardDescription className="text-xs">{game.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">House Edge: </span>
                  <span className="font-medium text-primary">{game.houseEdge}</span>
                </div>
                <Badge
                  variant={game.status === 'active' ? 'default' : 'secondary'}
                  className={game.status === 'active' ? 'bg-green-500/20 text-green-400 border-0' : ''}
                >
                  {game.status === 'active' ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Game Settings</CardTitle>
          <CardDescription>Global game configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Min Bet</span>
              <span className="font-medium">$0.10</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Max Bet</span>
              <span className="font-medium">$1,000.00</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Max Win</span>
              <span className="font-medium">$50,000.00</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Demo Balance</span>
              <span className="font-medium">$100.00</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Game parameters are currently hardcoded. Contact developer to modify.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGames;