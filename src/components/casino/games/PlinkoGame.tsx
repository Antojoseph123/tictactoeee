import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';
import Matter from 'matter-js';

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
            fillStyle: 'hsl(222, 30%, 25%)',
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
    Matter.Composite.add(engine.world, 
      Matter.Bodies.rectangle(-10, height / 2, 20, height, wallOptions)
    );
    // Right wall
    Matter.Composite.add(engine.world, 
      Matter.Bodies.rectangle(width + 10, height / 2, 20, height, wallOptions)
    );

    // Create bucket dividers and sensors
    const bucketY = height - 30;
    const bucketWidth = width / MULTIPLIERS.length;

    for (let i = 0; i <= MULTIPLIERS.length; i++) {
      const x = i * bucketWidth;
      // Divider
      const divider = Matter.Bodies.rectangle(x, bucketY, 4, 40, {
        isStatic: true,
        render: { fillStyle: 'hsl(222, 30%, 20%)' },
        chamfer: { radius: 2 },
      });
      Matter.Composite.add(engine.world, divider);
    }

    // Create bucket sensors
    for (let i = 0; i < MULTIPLIERS.length; i++) {
      const x = (i + 0.5) * bucketWidth;
      const sensor = Matter.Bodies.rectangle(x, height - 10, bucketWidth - 6, 20, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: 'transparent' },
        label: `bucket-${i}`,
      });
      Matter.Composite.add(engine.world, sensor);
    }

    // Start rendering and physics
    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    // Collision detection for buckets
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        let ball: Matter.Body | null = null;
        let bucket: Matter.Body | null = null;

        if (bodyA.label.startsWith('ball-') && bodyB.label.startsWith('bucket-')) {
          ball = bodyA;
          bucket = bodyB;
        } else if (bodyB.label.startsWith('ball-') && bodyA.label.startsWith('bucket-')) {
          ball = bodyB;
          bucket = bodyA;
        }

        if (ball && bucket) {
          const ballId = parseInt(ball.label.split('-')[1]);
          const bucketIndex = parseInt(bucket.label.split('-')[1]);
          
          // Only process if this ball hasn't landed yet
          if (activeBallsRef.current.has(ballId)) {
            activeBallsRef.current.delete(ballId);
            
            const multiplier = MULTIPLIERS[bucketIndex] || 1;
            const winAmount = betAmountRef.current * multiplier;
            
            setLastWin({ multiplier, amount: winAmount });
            onWin(winAmount);
            
            // Remove ball after short delay
            setTimeout(() => {
              Matter.Composite.remove(engine.world, ball!);
              if (activeBallsRef.current.size === 0) {
                setIsDropping(false);
              }
            }, 500);
          }
        }
      });
    });

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      render.canvas.remove();
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
        fillStyle: 'hsl(142, 70%, 45%)',
      },
      label: `ball-${ballId}`,
    });

    Matter.Composite.add(engineRef.current.world, ball);

    // Safety timeout - if ball gets stuck
    setTimeout(() => {
      if (activeBallsRef.current.has(ballId) && engineRef.current) {
        activeBallsRef.current.delete(ballId);
        Matter.Composite.remove(engineRef.current.world, ball);
        
        // Random bucket if ball got stuck
        const randomBucket = Math.floor(Math.random() * MULTIPLIERS.length);
        const multiplier = MULTIPLIERS[randomBucket];
        const winAmount = betAmountRef.current * multiplier;
        
        setLastWin({ multiplier, amount: winAmount });
        onWin(winAmount);
        
        if (activeBallsRef.current.size === 0) {
          setIsDropping(false);
        }
      }
    }, 8000);
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
