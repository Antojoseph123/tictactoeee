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

export const PlinkoGame = ({ balance, onBet, onWin }: PlinkoGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [isDropping, setIsDropping] = useState(false);
  const [lastWin, setLastWin] = useState<{ multiplier: number; amount: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const activeBallsRef = useRef<Set<number>>(new Set());
  const betAmountRef = useRef(betAmount);

  // Keep betAmount ref in sync
  useEffect(() => {
    betAmountRef.current = betAmount;
  }, [betAmount]);

  // Initialize physics engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = 400;
    const height = 500;

    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.2 },
    });
    engineRef.current = engine;

    // Create renderer
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

    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;

    // Peg settings
    const pegRadius = 5;
    const startY = 40;
    const endY = height - 60;
    const rowSpacing = (endY - startY) / ROWS;

    // Create pegs
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
          render: {
            fillStyle: 'hsl(222 30% 25%)',
          },
          label: 'peg',
        });
        Matter.Composite.add(engine.world, peg);
      }
    }

    // Create walls
    const wallOptions = {
      isStatic: true,
      render: { fillStyle: 'transparent' },
    };

    // Left wall
    Matter.Composite.add(engine.world, Matter.Bodies.rectangle(-10, height / 2, 20, height, wallOptions));
    // Right wall
    Matter.Composite.add(engine.world, Matter.Bodies.rectangle(width + 10, height / 2, 20, height, wallOptions));

    // Create bucket dividers and sensors
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

    // A floor so balls never fall into the void
    const floor = Matter.Bodies.rectangle(width / 2, height + 20, width + 80, 60, {
      isStatic: true,
      render: { fillStyle: 'transparent' },
      label: 'floor',
    });
    Matter.Composite.add(engine.world, floor);

    const settleBall = (ball: Matter.Body) => {
      const ballId = parseInt(ball.label.split('-')[1]);
      if (!activeBallsRef.current.has(ballId)) return;

      activeBallsRef.current.delete(ballId);

      const bucketIndex = Math.max(
        0,
        Math.min(MULTIPLIERS.length - 1, Math.floor(ball.position.x / bucketWidth))
      );
      const multiplier = MULTIPLIERS[bucketIndex] || 1;
      const winAmount = betAmountRef.current * multiplier;

      setLastWin({ multiplier, amount: winAmount });
      onWin(winAmount);

      setTimeout(() => {
        Matter.Composite.remove(engine.world, ball);
        if (activeBallsRef.current.size === 0) setIsDropping(false);
      }, 250);
    };

    // Start rendering and physics
    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    const onCollisionStart = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;

        // Settle as soon as a ball touches the floor
        if (bodyA.label.startsWith('ball-') && bodyB.label === 'floor') settleBall(bodyA);
        if (bodyB.label.startsWith('ball-') && bodyA.label === 'floor') settleBall(bodyB);
      }
    };

    const onAfterUpdate = () => {
      // Safety: if a ball is very low, settle it based on x-position
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
      // Important: do NOT remove the canvas element (React owns it)
      Matter.Events.off(engine, 'collisionStart', onCollisionStart);

      try {
        Matter.Render.stop(render);
        Matter.Runner.stop(runner);
        Matter.World.clear(engine.world, false);
        Matter.Engine.clear(engine);
        // prevent memory leaks from cached textures
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

  const dropBall = useCallback(async () => {
    if (!engineRef.current) return;
    
    const success = await onBet(betAmount);
    if (!success) return;

    setIsDropping(true);
    setLastWin(null);

    const ballId = Date.now();
    activeBallsRef.current.add(ballId);

    // Create ball with slight random offset
    const randomOffset = (Math.random() - 0.5) * 20;
    const ball = Matter.Bodies.circle(200 + randomOffset, 10, 8, {
      restitution: 0.6,
      friction: 0.1,
      frictionAir: 0.01,
      density: 0.001,
      render: {
        fillStyle: 'hsl(142 70% 45%)',
      },
      label: `ball-${ballId}`,
    });

    Matter.Composite.add(engineRef.current.world, ball);

    // Safety timeout - settle based on the ball's x-position
    setTimeout(() => {
      if (activeBallsRef.current.has(ballId) && engineRef.current) {
        activeBallsRef.current.delete(ballId);

        const width = 400;
        const bucketWidth = width / MULTIPLIERS.length;
        const bucketIndex = Math.max(0, Math.min(MULTIPLIERS.length - 1, Math.floor(ball.position.x / bucketWidth)));
        const multiplier = MULTIPLIERS[bucketIndex] || 1;
        const winAmount = betAmountRef.current * multiplier;

        setLastWin({ multiplier, amount: winAmount });
        onWin(winAmount);

        Matter.Composite.remove(engineRef.current.world, ball);

        if (activeBallsRef.current.size === 0) {
          setIsDropping(false);
        }
      }
    }, 7000);
  }, [betAmount, onBet, onWin]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Plinko</h2>
        <p className="text-sm text-text-muted">Drop the ball and watch it bounce</p>
      </div>

      {/* Plinko Board */}
      <div className="relative bg-surface rounded-xl overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={500}
          className="block"
        />
        
        {/* Multiplier labels overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {MULTIPLIERS.map((mult, i) => (
            <div
              key={i}
              className={`flex-1 py-2 text-center text-xs font-bold ${
                mult >= 3 ? 'text-primary' :
                mult >= 1 ? 'text-text' :
                'text-text-dim'
              }`}
            >
              {mult}x
            </div>
          ))}
        </div>
      </div>

      {/* Last win */}
      {lastWin && (
        <p className={`text-lg font-semibold ${lastWin.multiplier >= 1 ? 'text-primary' : 'text-text-dim'}`}>
          {lastWin.multiplier}x → ${lastWin.amount.toFixed(2)}
        </p>
      )}

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={isDropping}
        />

        <Button
          onClick={dropBall}
          disabled={isDropping || betAmount > balance}
          className="w-full h-12 font-semibold bg-primary hover:bg-primary-hover"
        >
          {isDropping ? 'Dropping...' : `Drop Ball ($${betAmount})`}
        </Button>
      </div>
    </div>
  );
};
