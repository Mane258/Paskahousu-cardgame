import { createDeck } from './deck';

// Function to start a new game
export const startGame = () => {
  // Create a new shuffled deck
  const deck = createDeck();
  // Deal 5 cards to the player and computer
  const playerHand = deck.splice(0, 5);
  const computerHand = deck.splice(0, 5);
  // Start with an empty pile
  const pile = [];
  // Return the initial game state with sorted player hand
  return { 
    playerHand: sortHand(playerHand),  // Sort the player's hand
    computerHand, 
    pile, 
    deck 
  };
};

// Helper function to check if a card is a deuce (2)
export const isDeuce = (card) => card.value === '2';

// Helper function to check if a card is a ten (10)
const isTen = (card) => card.value === '10';

// Helper function to check if a card is an ace (A)
const isAce = (card) => card.value === 'A';

// Function to check if a move is valid
export const isValidMove = (cards, pile) => {
  if (!Array.isArray(cards) || cards.length === 0) return false;
  if (pile.length === 0) return true; // Any card(s) can be played on an empty pile
  const topCard = pile[pile.length - 1];
  
  // Check if all cards have the same value
  if (!cards.every(card => card && card.value === cards[0].value)) return false;
  
  // Special rules for 2s, 10s, and Aces
  if (cards.length > 1 && ['2', '10', 'A'].includes(cards[0].value)) return false;
  
  if (isDeuce(topCard)) return isDeuce(cards[0]); // Only 2 can be played on 2
  if (isDeuce(cards[0])) return true; // Single 2 can be played on anything
  
  if (isTen(topCard)) return false; // Nothing can be played on 10
  if (isAce(topCard)) return false; // Nothing can be played on an ace
  
  if (isTen(cards[0])) {
    // 10 can be played on 3-9
    return ['3', '4', '5', '6', '7', '8', '9'].includes(topCard.value);
  }
  
  if (isAce(cards[0])) {
    // Ace can be played on J, Q, K
    return ['J', 'Q', 'K'].includes(topCard.value);
  }
  
  const cardOrder = ['3', '4', '5', '6', '7', '8', '9', 'J', 'Q', 'K', '10', 'A', '2'];
  const playedCardIndex = cardOrder.indexOf(cards[0].value);
  const topCardIndex = cardOrder.indexOf(topCard.value);
  
  // J, Q, K can't be played on 6 or lower
  if (['J', 'Q', 'K'].includes(cards[0].value) && cardOrder.indexOf(topCard.value) <= cardOrder.indexOf('6')) {
    return false;
  }
  
  // For all other cases, the played card(s) must be equal or higher than the top card
  return playedCardIndex >= topCardIndex;
};

// Helper function to check for four of a kind
const checkFourOfAKind = (pile) => {
  if (pile.length < 4) return false;
  const lastFour = pile.slice(-4);
  return lastFour.every(card => card.value === lastFour[0].value) && !isDeuce(lastFour[0]);
};

// Function to check if a player can make a move
export const canPlay = (hand, pile) => {
  if (pile.length === 0) return true;
  // Check single card plays
  if (hand.some(card => isValidMove([card], pile))) return true;
  // Check multiple card plays
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      if (hand[i].value === hand[j].value && isValidMove([hand[i], hand[j]], pile)) return true;
    }
  }
  return false;
};

// Modified playCard function
export const playCard = (hand, cards, pile, deck) => {
  if (!Array.isArray(hand) || !Array.isArray(deck) || !Array.isArray(pile) || !Array.isArray(cards)) {
    console.error('Invalid arguments in playCard:', { hand, cards, pile, deck });
    return { hand: hand || [], deck: deck || [], pile: pile || [], foldedPile: false };
  }
  if (!isValidMove(cards, pile)) {
    console.error('Invalid move:', { cards, topCard: pile[pile.length - 1] });
    return { hand, deck, pile, foldedPile: false };
  }
  
  let foldedPile = false;
  let specialPlay = false;
  let opponentPicksUp = false;

  // Remove the played cards from hand
  hand = hand.filter(c => !cards.some(playedCard => playedCard.value === c.value && playedCard.suit === c.suit));

  if (pile.length === 0 && (isTen(cards[0]) || isAce(cards[0]))) {
    opponentPicksUp = true;
    pile.push(...cards);
  } else if (isTen(cards[0])) {
    foldedPile = true;
    pile = []; // Fold the pile
  } else if (isAce(cards[0]) && pile.length > 0) {
    const topCard = pile[pile.length - 1];
    if (['J', 'Q', 'K'].includes(topCard.value)) {
      foldedPile = true;
      pile = []; // Fold the pile
    } else {
      pile.push(...cards);
    }
  } else {
    pile.push(...cards);
    
    // Check if the pile should be folded due to four of a kind (excluding deuces)
    if (checkFourOfAKind(pile) && !isDeuce(cards[0])) {
      pile = [];
      foldedPile = true;
    }
  }

  // Refill the hand to 5 cards if possible
  hand = fillHandToFive(hand, deck);

  return { hand, deck, pile, foldedPile, specialPlay, opponentPicksUp };
};

// Helper function to fill a hand to 5 cards
const fillHandToFive = (hand, deck) => {
  // Error checking for invalid inputs
  if (!Array.isArray(hand) || !Array.isArray(deck)) {
    console.error('Invalid hand or deck:', { hand, deck });
    return hand || [];
  }
  // Add cards from the deck to the hand until it has 5 cards or the deck is empty
  while (hand.length < 5 && deck.length > 0) {
    hand.push(deck.pop());
  }
  return hand;
};

// Function to draw a card
export const drawCard = (hand, deck, pile) => {
  if (deck.length > 0) {
    const drawnCard = deck.pop();
    hand.push(drawnCard);
    hand = sortHand(hand);
    return { hand, deck, pile, cardDrawn: true, drawnCard };
  } else {
    return { hand, deck, pile, cardDrawn: false, drawnCard: null };
  }
};

// Function to handle the computer's move
export const computerMove = (computerHand, pile, deck) => {
  console.log("Computer's turn. Hand:", computerHand, "Top of pile:", pile[pile.length - 1]);

  if (canPlay(computerHand, pile)) {
    let validPlays = [];
    const order = ['3', '4', '5', '6', '7', '8', '9', 'J', 'Q', 'K', '10', 'A', '2'];

    // Check for valid single card plays
    validPlays = computerHand.filter(card => isValidMove([card], pile)).map(card => [card]);

    // Check for valid multiple card plays (excluding 10s, Aces, and 2s)
    for (let i = 0; i < computerHand.length; i++) {
      if (!isDeuce(computerHand[i]) && !isTen(computerHand[i]) && !isAce(computerHand[i])) {
        let sameValueCards = computerHand.filter(card => card.value === computerHand[i].value);
        if (sameValueCards.length > 1 && isValidMove(sameValueCards, pile)) {
          validPlays.push(sameValueCards);
        }
      }
    }

    // Sort valid plays
    validPlays.sort((a, b) => {
      const valueCompare = order.indexOf(a[0].value) - order.indexOf(b[0].value);
      if (valueCompare !== 0) return valueCompare;
      return b.length - a.length; // If values are the same, prefer playing more cards
    });

    // Play the first (smallest) valid play
    if (validPlays.length > 0) {
      const bestPlay = validPlays[0];
      console.log("Computer's best play:", bestPlay);
      const result = playCard(computerHand, bestPlay, pile, deck);
      
      console.log("Result of computer's play:", result);

      return { 
        ...result, 
        cardPlayed: true, 
        playedCard: bestPlay[0],
        foldedPile: result.foldedPile  // Ensure this is being set correctly
      };
    }
  }
  
  console.log("Computer can't play, picking up the pile");
  return { 
    hand: [...computerHand, ...pile], 
    deck: deck, 
    pile: [], 
    cardPlayed: false,
    foldedPile: false,
    fourDeuces: false,
    pickedUpPile: true
  };
};

// Helper function to check if four deuces are in the pile
const checkFourDeuces = (pile) => {
  return pile.length >= 4 && pile.slice(-4).every(isDeuce);
};

const cardOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

export const removeDuplicates = (cards) => {
  return cards.filter((card, index, self) =>
    index === self.findIndex((t) => t.value === card.value && t.suit === card.suit)
  );
};

export const sortHand = (hand) => {
  const uniqueHand = removeDuplicates(hand);
  return uniqueHand.sort((a, b) => {
    const indexA = cardOrder.indexOf(a.value);
    const indexB = cardOrder.indexOf(b.value);
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.suit.localeCompare(b.suit);
  });
};

export const initializeGame = () => {
  const deck = createShuffledDeck();
  const playerHand = [];
  const computerHand = [];

  // Always deal 5 cards to each player
  for (let i = 0; i < 5; i++) {
    playerHand.push(deck.pop());
    computerHand.push(deck.pop());
  }

  return {
    playerHand: sortHand(playerHand),
    computerHand,
    deck,
    pile: [],
  };
};

// Helper function to check if a player must pick up the pile
export const mustPickUpPile = (hand, pile) => {
  if (pile.length === 0) return false;
  const topCard = pile[pile.length - 1];
  if (isDeuce(topCard)) {
    return !hand.some(card => isDeuce(card));
  }
  return !canPlay(hand, pile);
};