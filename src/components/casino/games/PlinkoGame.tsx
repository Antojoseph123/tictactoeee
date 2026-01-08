import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';
import * as Matter from 'matter-js';

interface PlinkoGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

const ROWS = 12;
const MULTIPLIERS = [10, 3, 1.5, 1.2, 1, 0.5, 0.3, 0.5, 1, 1.2, 1.5, 3, 10];
const BALL_COUNTS = [1, 3, 5, 10];

export const PlinkoGame = ({ balance, onBet, onWin }: PlinkoGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [ballCount, setBallCount] = useState(1);
  const [isDropping, setIsDropping] = useState(false);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [activeBallCount, setActiveBallCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const activeBallsRef = useRef<Map<number, number>>(new Map()); // ballId -> betAmount
  const sessionProfitRef = useRef(0);

  // Initialize physics engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = 400;
    const height = 500;

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

    // Peg settings
    const pegRadius = 5;
    const startY = 40;
    const endY = height - 60;
    const rowSpacing = (endY - startY) / ROWS;

    for (let row = 0; row < ROWS; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * 28;
      const startX = (width - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * 28;
        const y = startY + row * rowSpacing;

        const peg = Matter.Bodies.circle(x, y, pegRadius, {
          isStatic: true,
          restitution: 0.5,
          friction: 0.1,
          render: { fillStyle: 'hsl(222 30% 25%)' },
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
    const bucketWidth = width / MULTIPLIERS.length;

    for (let i = 0; i <= MULTIPLIERS.length; i++) {
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

      const bucketIndex = Math.max(0, Math.min(MULTIPLIERS.length - 1, Math.floor(ball.position.x / bucketWidth)));
      const multiplier = MULTIPLIERS[bucketIndex] || 1;
      const winAmount = ballBet * multiplier;
      const profit = winAmount - ballBet;

      sessionProfitRef.current += profit;
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
  }, [onWin]);

  const spawnBall = useCallback((betAmt: number) => {
    if (!engineRef.current) return;

    const ballId = Date.now() + Math.random() * 1000;
    activeBallsRef.current.set(ballId, betAmt);
    setActiveBallCount(activeBallsRef.current.size);

    const randomOffset = (Math.random() - 0.5) * 30;
    const ball = Matter.Bodies.circle(200 + randomOffset, 10, 8, {
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

        const width = 400;
        const bucketWidth = width / MULTIPLIERS.length;
        const bucketIndex = Math.max(0, Math.min(MULTIPLIERS.length - 1, Math.floor(ball.position.x / bucketWidth)));
        const multiplier = MULTIPLIERS[bucketIndex] || 1;
        const winAmount = betAmt * multiplier;
        const profit = winAmount - betAmt;

        sessionProfitRef.current += profit;
        setSessionProfit(sessionProfitRef.current);
        onWin(winAmount);

        Matter.Composite.remove(engineRef.current.world, ball);
        setActiveBallCount(activeBallsRef.current.size);

        if (activeBallsRef.current.size === 0) {
          setIsDropping(false);
        }
      }
    }, 7000);
  }, [onWin]);

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
      }, i * 150); // 150ms delay between each ball
    }
  }, [betAmount, ballCount, balance, onBet, spawnBall]);

  const totalCost = betAmount * ballCount;

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Plinko</h2>
        <p className="text-sm text-text-muted">Drop balls and watch them bounce</p>
      </div>

      {/* Plinko Board */}
      <div className="relative bg-surface rounded-xl overflow-hidden">
        <canvas ref={canvasRef} width={400} height={500} className="block" />
        
        {/* Active balls counter */}
        {activeBallCount > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-surface-elevated rounded text-xs font-medium">
            {activeBallCount} ball{activeBallCount > 1 ? 's' : ''} active
          </div>
        )}
        
        {/* Multiplier labels overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {MULTIPLIERS.map((mult, i) => (
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
        <p className={`text-lg font-semibold ${sessionProfit >= 0 ? 'text-primary' : 'text-red-500'}`}>
          {sessionProfit >= 0 ? '+' : ''}${sessionProfit.toFixed(2)}
        </p>
      )}

      {/* Controls */}
      <div className="w-full max-w-sm space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={isDropping}
        />

        {/* Ball count selector */}
        <div className="space-y-2">
          <label className="text-xs text-text-muted uppercase tracking-wide">Balls</label>
          <div className="flex gap-2">
            {BALL_COUNTS.map((count) => (
              <button
                key={count}
                onClick={() => setBallCount(count)}
                disabled={isDropping}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  ballCount === count
                    ? 'bg-primary text-white'
                    : 'bg-surface-elevated text-text-muted hover:text-text'
                } disabled:opacity-50`}
              >
                {count}x
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={dropBalls}
          disabled={isDropping || totalCost > balance}
          className="w-full h-12 font-semibold bg-primary hover:bg-primary-hover"
        >
          {isDropping 
            ? `Dropping... (${activeBallCount})` 
            : `Drop ${ballCount} Ball${ballCount > 1 ? 's' : ''} ($${totalCost.toFixed(2)})`
          }
        </Button>
      </div>
    </div>
  );
};
