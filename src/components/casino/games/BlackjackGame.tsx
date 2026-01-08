import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';

type Card = { suit: string; value: string; numValue: number };
type GameState = 'betting' | 'playing' | 'dealer' | 'result';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      let numValue = parseInt(value);
      if (value === 'A') numValue = 11;
      else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
      deck.push({ suit, value, numValue });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateHand = (cards: Card[]): number => {
  let total = cards.reduce((sum, card) => sum + card.numValue, 0);
  let aces = cards.filter(c => c.value === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
};

interface BlackjackGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

export const BlackjackGame = ({ balance, onBet, onWin }: BlackjackGameProps) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [betAmount, setBetAmount] = useState(5);
  const [result, setResult] = useState<string>('');
  const [currentBet, setCurrentBet] = useState(0);

  const drawCard = useCallback((currentDeck: Card[]): [Card, Card[]] => {
    const newDeck = [...currentDeck];
    const card = newDeck.pop()!;
    return [card, newDeck];
  }, []);

  const startGame = useCallback(async () => {
    const success = await onBet(betAmount);
    if (!success) return;

    setCurrentBet(betAmount);

    const newDeck = createDeck();
    const [p1, d1] = [newDeck.pop()!, newDeck.pop()!];
    const [p2, d2] = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    setResult('');
    
    const playerTotal = calculateHand([p1, p2]);
    if (playerTotal === 21) {
      setGameState('result');
      setResult('Blackjack!');
      onWin(betAmount * 2.5);
    } else {
      setGameState('playing');
    }
  }, [betAmount, onBet, onWin]);

  const hit = useCallback(() => {
    const [card, newDeck] = drawCard(deck);
    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);

    const total = calculateHand(newHand);
    if (total > 21) {
      setGameState('result');
      setResult('Bust!');
    } else if (total === 21) {
      stand(newDeck, newHand);
    }
  }, [deck, playerHand, drawCard]);

  const stand = useCallback((currentDeck?: Card[], currentPlayerHand?: Card[]) => {
    setGameState('dealer');
    
    let currentDealer = [...dealerHand];
    let workingDeck = currentDeck || [...deck];
    const playerTotal = calculateHand(currentPlayerHand || playerHand);

    const dealerPlay = () => {
      const dealerTotal = calculateHand(currentDealer);
      
      if (dealerTotal < 17) {
        setTimeout(() => {
          const [card, newDeck] = drawCard(workingDeck);
          workingDeck = newDeck;
          currentDealer = [...currentDealer, card];
          setDealerHand(currentDealer);
          setDeck(workingDeck);
          dealerPlay();
        }, 500);
      } else {
        setTimeout(() => {
          const finalDealerTotal = calculateHand(currentDealer);
          
          if (finalDealerTotal > 21) {
            setResult('Dealer Busts! You Win!');
            onWin(currentBet * 2);
          } else if (finalDealerTotal > playerTotal) {
            setResult('Dealer Wins');
          } else if (playerTotal > finalDealerTotal) {
            setResult('You Win!');
            onWin(currentBet * 2);
          } else {
            setResult('Push - Tie');
            onWin(currentBet);
          }
          setGameState('result');
        }, 300);
      }
    };

    dealerPlay();
  }, [dealerHand, deck, playerHand, drawCard, currentBet, onWin]);

  const newRound = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameState('betting');
    setResult('');
  };

  const CardComponent = ({ card, hidden = false }: { card: Card; hidden?: boolean }) => (
    <motion.div
      initial={{ scale: 0, rotateY: 180 }}
      animate={{ scale: 1, rotateY: 0 }}
      className={`w-14 h-20 rounded-lg flex items-center justify-center text-lg font-bold shadow-lg ${
        hidden 
          ? 'bg-gradient-to-br from-primary to-primary/80' 
          : 'bg-white text-black'
      }`}
    >
      {hidden ? '?' : (
        <span className={card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'}>
          {card.value}{card.suit}
        </span>
      )}
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Blackjack</h2>
        <p className="text-sm text-muted-foreground">Get closer to 21 than the dealer</p>
      </div>

      {/* Game Area */}
      <div className="w-full max-w-md p-6 bg-muted/20 rounded-xl border border-border">
        {/* Dealer Hand */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            Dealer {gameState !== 'betting' && gameState !== 'playing' && `(${calculateHand(dealerHand)})`}
          </p>
          <div className="flex gap-2 min-h-[80px]">
            <AnimatePresence>
              {dealerHand.map((card, i) => (
                <CardComponent 
                  key={`${card.suit}${card.value}${i}`} 
                  card={card} 
                  hidden={i === 1 && gameState === 'playing'}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Player Hand */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Your Hand {playerHand.length > 0 && `(${calculateHand(playerHand)})`}
          </p>
          <div className="flex gap-2 min-h-[80px]">
            <AnimatePresence>
              {playerHand.map((card, i) => (
                <CardComponent key={`${card.suit}${card.value}${i}`} card={card} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`mt-4 text-center text-xl font-bold ${
                result.includes('Win') || result.includes('Blackjack') ? 'indicator-win' : 
                result.includes('Bust') || result.includes('Dealer') ? 'indicator-loss' : 
                'text-foreground'
              }`}
            >
              {result}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        {gameState === 'betting' && (
          <>
            <BetControls
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              balance={balance}
            />
            <Button
              onClick={startGame}
              disabled={betAmount > balance}
              className="w-full h-12 font-semibold bg-primary hover:bg-primary-glow"
            >
              Deal (${betAmount})
            </Button>
          </>
        )}

        {gameState === 'playing' && (
          <div className="flex gap-3">
            <Button onClick={hit} className="flex-1 h-12 font-semibold">
              Hit
            </Button>
            <Button onClick={() => stand()} variant="secondary" className="flex-1 h-12 font-semibold">
              Stand
            </Button>
          </div>
        )}

        {gameState === 'result' && (
          <Button onClick={newRound} className="w-full h-12 font-semibold">
            New Hand
          </Button>
        )}
      </div>
    </div>
  );
};
