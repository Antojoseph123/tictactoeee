import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import * as Matter from 'matter-js';

interface PlinkoGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

type RiskLevel = 'low' | 'medium' | 'high';

const ROWS = 12;
const BALL_COUNTS = [1, 3, 5, 10];

const MULTIPLIERS: Record<RiskLevel, number[]> = {
  low: [1.5, 1.2, 1.1, 1, 0.9, 0.7, 0.5, 0.7, 0.9, 1, 1.1, 1.2, 1.5],
  medium: [3, 1.5, 1.3, 1.1, 1, 0.5, 0.3, 0.5, 1, 1.1, 1.3, 1.5, 3],
  high: [10, 3, 1.5, 1.2, 1, 0.5, 0.2, 0.5, 1, 1.2, 1.5, 3, 10],
};

const PlinkoGame = ({ balance, onBet, onWin }: PlinkoGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [ballCount, setBallCount] = useState(1);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium');
  const [isDropping, setIsDropping] = useState(false);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [activeBallCount, setActiveBallCount] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 500 });

  // Auto mode state
  const [autoMode, setAutoMode] = useState(false);
  const [autoBalls, setAutoBalls] = useState(10);
  const [stopOnProfit, setStopOnProfit] = useState(100);
  const [stopOnLoss, setStopOnLoss] = useState(50);
  const [autoDropped, setAutoDropped] = useState(0);
  const autoModeRef = useRef(false);
  const autoProfitRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const activeBallsRef = useRef<Map<number, number>>(new Map());
  const sessionProfitRef = useRef(0);
  const riskLevelRef = useRef<RiskLevel>(riskLevel);

  useEffect(() => {
    riskLevelRef.current = riskLevel;
  }, [riskLevel]);

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const maxWidth = Math.min(containerWidth - 16, 400);
      const height = Math.round(maxWidth * 1.25);
      setCanvasSize({ width: maxWidth, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize physics engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const { width, height } = canvasSize;
    const currentMultipliers = MULTIPLIERS[riskLevelRef.current];

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.2 },
    });
    engineRef.current = engine;

    const render = Matter.Render.create({
      canvas,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;

    const runner = Matter.Runner.create();
    runnerRef.current = runner;

    // Peg settings - vary density by risk
    const pegRadius = riskLevelRef.current === 'high' ? 4 : riskLevelRef.current === 'low' ? 6 : 5;
    const pegSpacing = riskLevelRef.current === 'high' ? 26 : riskLevelRef.current === 'low' ? 30 : 28;
    const startY = 40;
    const endY = height - 60;
    const rowSpacing = (endY - startY) / ROWS;

    for (let row = 0; row < ROWS; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegSpacing;
      const startX = (width - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * pegSpacing;
        const y = startY + row * rowSpacing;

        const peg = Matter.Bodies.circle(x, y, pegRadius, {
          isStatic: true,
          restitution: riskLevelRef.current === 'high' ? 0.7 : riskLevelRef.current === 'low' ? 0.3 : 0.5,
          friction: 0.1,
          render: { 
            fillStyle: riskLevelRef.current === 'high' 
              ? 'hsl(0 50% 40%)' 
              : riskLevelRef.current === 'low' 
                ? 'hsl(142 50% 35%)' 
                : 'hsl(222 30% 25%)' 
          },
          label: 'peg',
        });
        Matter.Composite.add(engine.world, peg);
      }
    }

    // Walls
    const wallOptions = { isStatic: true, render: { fillStyle: 'transparent' } };
    Matter.Composite.add(engine.world, Matter.Bodies.rectangle(-10, height / 2, 20, height, wallOptions));
    Matter.Composite.add(engine.world, Matter.Bodies.rectangle(width + 10, height / 2, 20, height, wallOptions));

    // Bucket dividers
    const bucketY = height - 30;
    const bucketWidth = width / currentMultipliers.length;

    for (let i = 0; i <= currentMultipliers.length; i++) {
      const x = i * bucketWidth;
      const divider = Matter.Bodies.rectangle(x, bucketY, 4, 40, {
        isStatic: true,
        render: { fillStyle: 'hsl(222 30% 20%)' },
        chamfer: { radius: 2 },
        label: 'divider',
      });
      Matter.Composite.add(engine.world, divider);
    }

    // Floor
    const floor = Matter.Bodies.rectangle(width / 2, height + 20, width + 80, 60, {
      isStatic: true,
      render: { fillStyle: 'transparent' },
      label: 'floor',
    });
    Matter.Composite.add(engine.world, floor);

    const settleBall = (ball: Matter.Body) => {
      const ballId = parseInt(ball.label.split('-')[1]);
      const ballBet = activeBallsRef.current.get(ballId);
      if (ballBet === undefined) return;

      activeBallsRef.current.delete(ballId);
      
      const currentMults = MULTIPLIERS[riskLevelRef.current];
      const bWidth = width / currentMults.length;

      const bucketIndex = Math.max(0, Math.min(currentMults.length - 1, Math.floor(ball.position.x / bWidth)));
      const multiplier = currentMults[bucketIndex] || 1;
      const winAmount = ballBet * multiplier;
      const profit = winAmount - ballBet;

      sessionProfitRef.current += profit;
      autoProfitRef.current += profit;
      setSessionProfit(sessionProfitRef.current);
      onWin(winAmount);

      setTimeout(() => {
        Matter.Composite.remove(engine.world, ball);
        setActiveBallCount(activeBallsRef.current.size);
        if (activeBallsRef.current.size === 0) {
          setIsDropping(false);
        }
      }, 200);
    };

    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    const onCollisionStart = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        if (bodyA.label.startsWith('ball-') && bodyB.label === 'floor') settleBall(bodyA);
        if (bodyB.label.startsWith('ball-') && bodyA.label === 'floor') settleBall(bodyB);
      }
    };

    const onAfterUpdate = () => {
      for (const body of engine.world.bodies) {
        if (!body.label.startsWith('ball-')) continue;
        if (body.position.y >= height - 18) {
          settleBall(body);
        }
      }
    };

    Matter.Events.on(engine, 'collisionStart', onCollisionStart);
    Matter.Events.on(engine, 'afterUpdate', onAfterUpdate);

    return () => {
      Matter.Events.off(engine, 'collisionStart', onCollisionStart);
      Matter.Events.off(engine, 'afterUpdate', onAfterUpdate);

      try {
        Matter.Render.stop(render);
        Matter.Runner.stop(runner);
        Matter.World.clear(engine.world, false);
        Matter.Engine.clear(engine);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (render as any).textures = {};
      } finally {
        engineRef.current = null;
        renderRef.current = null;
        runnerRef.current = null;
        activeBallsRef.current.clear();
      }
    };
  }, [onWin, canvasSize, riskLevel]);

  const spawnBall = useCallback((betAmt: number) => {
    if (!engineRef.current) return;

    const ballId = Date.now() + Math.random() * 1000;
    activeBallsRef.current.set(ballId, betAmt);
    setActiveBallCount(activeBallsRef.current.size);

    const { width } = canvasSize;
    const currentMults = MULTIPLIERS[riskLevelRef.current];
    const randomOffset = (Math.random() - 0.5) * 30;
    const ballRadius = Math.max(6, width / 50);
    const ball = Matter.Bodies.circle(width / 2 + randomOffset, 10, ballRadius, {
      restitution: 0.6,
      friction: 0.1,
      frictionAir: 0.01,
      density: 0.001,
      render: { fillStyle: 'hsl(142 70% 45%)' },
      label: `ball-${ballId}`,
    });

    Matter.Composite.add(engineRef.current.world, ball);

    // Safety timeout
    setTimeout(() => {
      if (activeBallsRef.current.has(ballId) && engineRef.current) {
        activeBallsRef.current.delete(ballId);

        const bucketWidth = canvasSize.width / currentMults.length;
        const bucketIndex = Math.max(0, Math.min(currentMults.length - 1, Math.floor(ball.position.x / bucketWidth)));
        const multiplier = currentMults[bucketIndex] || 1;
        const winAmount = betAmt * multiplier;
        const profit = winAmount - betAmt;

        sessionProfitRef.current += profit;
        autoProfitRef.current += profit;
        setSessionProfit(sessionProfitRef.current);
        onWin(winAmount);

        Matter.Composite.remove(engineRef.current.world, ball);
        setActiveBallCount(activeBallsRef.current.size);

        if (activeBallsRef.current.size === 0) {
          setIsDropping(false);
        }
      }
    }, 7000);
  }, [onWin, canvasSize]);

  const dropBalls = useCallback(async () => {
    if (!engineRef.current) return;

    const totalCost = betAmount * ballCount;
    if (totalCost > balance) return;

    // Reset session profit for new drop
    sessionProfitRef.current = 0;
    setSessionProfit(0);
    setIsDropping(true);

    // Drop balls with staggered timing
    for (let i = 0; i < ballCount; i++) {
      const success = await onBet(betAmount);
      if (!success) break;

      setTimeout(() => {
        spawnBall(betAmount);
      }, i * 150);
    }
  }, [betAmount, ballCount, balance, onBet, spawnBall]);

  // Auto mode logic
  const startAutoMode = useCallback(async () => {
    if (!engineRef.current) return;

    autoModeRef.current = true;
    autoProfitRef.current = 0;
    setAutoDropped(0);

    const runAutoDrop = async (dropped: number) => {
      if (!autoModeRef.current) return;
      if (dropped >= autoBalls) {
        autoModeRef.current = false;
        setAutoMode(false);
        return;
      }

      // Check stop conditions
      if (autoProfitRef.current >= stopOnProfit) {
        autoModeRef.current = false;
        setAutoMode(false);
        return;
      }
      if (autoProfitRef.current <= -stopOnLoss) {
        autoModeRef.current = false;
        setAutoMode(false);
        return;
      }

      if (betAmount > balance) {
        autoModeRef.current = false;
        setAutoMode(false);
        return;
      }

      const success = await onBet(betAmount);
      if (!success) {
        autoModeRef.current = false;
        setAutoMode(false);
        return;
      }

      setIsDropping(true);
      spawnBall(betAmount);
      setAutoDropped(dropped + 1);

      setTimeout(() => {
        runAutoDrop(dropped + 1);
      }, 800);
    };

    runAutoDrop(0);
  }, [autoBalls, betAmount, balance, onBet, spawnBall, stopOnProfit, stopOnLoss]);

  const stopAutoMode = useCallback(() => {
    autoModeRef.current = false;
    setAutoMode(false);
  }, []);

  const toggleAutoMode = useCallback(() => {
    if (autoMode) {
      stopAutoMode();
    } else {
      setAutoMode(true);
      startAutoMode();
    }
  }, [autoMode, startAutoMode, stopAutoMode]);

  const totalCost = betAmount * ballCount;
  const currentMultipliers = MULTIPLIERS[riskLevel];

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6 w-full">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2">Plinko</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Drop balls and watch them bounce</p>
      </div>

      {/* Plinko Board */}
      <div ref={containerRef} className="relative bg-muted/20 rounded-xl overflow-hidden w-full max-w-md border border-border">
        <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="block mx-auto" />
        
        {/* Active balls counter */}
        {activeBallCount > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-surface-elevated rounded text-xs font-medium">
            {activeBallCount} ball{activeBallCount > 1 ? 's' : ''} active
          </div>
        )}

        {/* Auto mode indicator */}
        {autoMode && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
            Auto: {autoDropped}/{autoBalls}
          </div>
        )}
        
        {/* Multiplier labels overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {currentMultipliers.map((mult, i) => (
            <div
              key={i}
              className={`flex-1 py-2 text-center text-xs font-bold ${
                mult >= 3 ? 'text-primary' : mult >= 1 ? 'text-text' : 'text-text-dim'
              }`}
            >
              {mult}x
            </div>
          ))}
        </div>
      </div>

      {/* Session profit */}
      {(isDropping || sessionProfit !== 0) && (
        <p className={`text-base sm:text-lg font-semibold ${sessionProfit >= 0 ? 'indicator-win' : 'indicator-loss'}`}>
          {sessionProfit >= 0 ? '+' : ''}${sessionProfit.toFixed(2)}
        </p>
      )}

      {/* Controls */}
      <div className="w-full max-w-sm space-y-3 sm:space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={isDropping || autoMode}
        />

        {/* Risk level selector */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Risk</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as RiskLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setRiskLevel(level)}
                disabled={isDropping || autoMode}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors capitalize ${
                  riskLevel === level
                    ? level === 'high' 
                      ? 'bg-destructive text-destructive-foreground'
                      : level === 'low'
                        ? 'bg-green-600 text-white'
                        : 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                } disabled:opacity-50`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Ball count selector */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Balls</label>
          <div className="flex gap-2">
            {BALL_COUNTS.map((count) => (
              <button
                key={count}
                onClick={() => setBallCount(count)}
                disabled={isDropping || autoMode}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  ballCount === count
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                } disabled:opacity-50`}
              >
                {count}x
              </button>
            ))}
          </div>
        </div>

        {/* Auto mode settings */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Auto Mode</label>
            <Switch
              checked={autoMode}
              onCheckedChange={toggleAutoMode}
              disabled={isDropping && !autoMode}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Balls</label>
              <Input
                type="number"
                value={autoBalls}
                onChange={(e) => setAutoBalls(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={autoMode}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground text-green-400">Stop +$</label>
              <Input
                type="number"
                value={stopOnProfit}
                onChange={(e) => setStopOnProfit(Math.max(0, parseFloat(e.target.value) || 0))}
                disabled={autoMode}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground text-red-400">Stop -$</label>
              <Input
                type="number"
                value={stopOnLoss}
                onChange={(e) => setStopOnLoss(Math.max(0, parseFloat(e.target.value) || 0))}
                disabled={autoMode}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={autoMode ? stopAutoMode : dropBalls}
          disabled={(!autoMode && isDropping) || totalCost > balance}
          variant={autoMode ? 'destructive' : 'default'}
          className="w-full h-11 sm:h-12 font-semibold"
        >
          {autoMode 
            ? 'Stop Auto'
            : isDropping 
              ? `Dropping... (${activeBallCount})` 
              : `Drop ${ballCount} Ball${ballCount > 1 ? 's' : ''} ($${totalCost.toFixed(2)})`
          }
        </Button>
      </div>
    </div>
  );
};

export { PlinkoGame };
