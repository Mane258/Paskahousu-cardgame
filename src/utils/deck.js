// utils/deck.js

// Function to create and shuffle a new deck of cards
export const createDeck = () => {
    // Define the suits and values for the cards
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
    // Initialize an empty array to hold the deck
    let deck = [];

    // Create a card for each combination of suit and value
    suits.forEach(suit => {
      values.forEach(value => {
        // Add a new card object to the deck
        deck.push({ suit, value });
      });
    });
  
    // Shuffle the deck and return it
    return shuffle(deck);
  };
  
  // Function to shuffle the deck using the Fisher-Yates algorithm
  const shuffle = (deck) => {
    // Start from the last card and work backwards
    for (let i = deck.length - 1; i > 0; i--) {
      // Generate a random index from 0 to i
      const j = Math.floor(Math.random() * (i + 1));
      // Swap the current card with the randomly selected card
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    // Return the shuffled deck
    return deck;
  };
