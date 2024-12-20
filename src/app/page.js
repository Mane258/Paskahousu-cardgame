"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  startGame,
  playCard,
  computerMove,
  drawCard,
  isDeuce,
  sortHand,
  isValidMove,
  removeDuplicates,
  mustPickUpPile,
} from "../utils/gameLogic";
import styles from "./styles.module.css";

export default function Home() {
  // State to hold the current game state
  const [gameState, setGameState] = useState(() => {
    const initialGameState = startGame();
    return {
      ...initialGameState,
      playerHand: sortHand(initialGameState.playerHand),
      currentTurn: "player", // Set initial turn to player
    };
  });
  const [selectedCards, setSelectedCards] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [triggerComputerTurn, setTriggerComputerTurn] = useState(false);
  const [gameMessage, setGameMessage] = useState("Game started. Your turn!");
  const [gameOver, setGameOver] = useState(false);

  // Effect to set isMounted to true when the component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state if game hasn't initialized yet
  if (!gameState) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const handleCardSelect = (card) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
    } else if (
      selectedCards.length === 0 ||
      (selectedCards[0].value === card.value &&
        !["2", "10", "A"].includes(card.value))
    ) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handlePlayCards = () => {
    if (selectedCards.length === 0) return;
    console.log("Player attempting to play cards:", selectedCards);
    console.log("Current pile:", gameState.pile);

    if (!isValidMove(selectedCards, gameState.pile)) {
      console.log("Invalid move detected");
      displayMessage("You cannot play those cards.");
      return;
    }

    if (mustPickUpPile(gameState.playerHand, gameState.pile)) {
      displayMessage("You can't play. You must pick up the pile.");
      setGameState((prevState) => ({
        ...prevState,
        playerHand: sortHand(
          removeDuplicates([...prevState.playerHand, ...prevState.pile])
        ),
        pile: [],
        currentTurn: "computer",
      }));
      setTriggerComputerTurn(true);
      return;
    }

    let {
      hand: newPlayerHand,
      deck: newDeck,
      pile: newPile,
      foldedPile,
      specialPlay,
      opponentPicksUp,
    } = playCard(
      gameState.playerHand,
      selectedCards,
      gameState.pile,
      gameState.deck
    );

    if (newPlayerHand === gameState.playerHand) {
      displayMessage("You cannot play those cards.");
      return;
    }

    let nextTurn = "computer";
    let message = "";

    if (newPlayerHand.length === 0) {
      message = "Congratulations! You have won the game!";
      nextTurn = "gameOver";
    } else if (opponentPicksUp) {
      message = `You played ${selectedCards[0].value} on an empty pile. Computer must pick it up. You get another turn.`;
      nextTurn = "player";
    } else if (foldedPile) {
      if (selectedCards[0].value === "10") {
        message = "10 folds the pile! You get another turn.";
      } else if (selectedCards[0].value === "A") {
        message = "Ace folds the pile! You get another turn.";
      } else {
        message = "Four of a kind folds the pile! You get another turn.";
      }
      nextTurn = "player";
    } else if (isDeuce(selectedCards[0])) {
      message = "You played a 2. It's now the computer's turn.";
    } else if (selectedCards.length > 1) {
      const numberWords = ["", "one", "two", "three", "four"];
      const numberWord =
        numberWords[selectedCards.length] || selectedCards.length.toString();
      message = `You played ${numberWord} ${selectedCards[0].value}'s. It's now the computer's turn.`;
    } else {
      message = `You played a ${selectedCards[0].value} ${selectedCards[0].suit}. It's now the computer's turn.`;
    }

    displayMessage(message);

    setGameState((prevState) => ({
      ...prevState,
      playerHand: sortHand(removeDuplicates(newPlayerHand)),
      computerHand: opponentPicksUp
        ? [...prevState.computerHand, ...newPile]
        : prevState.computerHand,
      deck: newDeck,
      pile: opponentPicksUp ? [] : newPile,
      currentTurn: nextTurn,
    }));

    setSelectedCards([]);

    if (nextTurn === "computer") {
      setTriggerComputerTurn(true);
    }

    if (nextTurn === "gameOver") {
      setGameOver(true);
    }
  };

  const handleDrawCard = () => {
    const {
      hand: newPlayerHand,
      deck: newDeck,
      pile: newPile,
      cardDrawn,
      drawnCard,
    } = drawCard(gameState.playerHand, gameState.deck, gameState.pile);

    if (cardDrawn) {
      displayMessage(`You drew: ${drawnCard.value} of ${drawnCard.suit}`);
      console.log(`You drew: ${drawnCard.value} of ${drawnCard.suit}`);
      if (isValidMove([drawnCard], gameState.pile)) {
        const {
          hand: finalPlayerHand,
          deck: finalDeck,
          pile: finalPile,
          foldedPile,
          specialPlay,
        } = playCard(newPlayerHand, [drawnCard], gameState.pile, newDeck);

        let nextTurn = "computer";
        let message = `${drawnCard.value} of ${drawnCard.suit} played. It's now the computer's turn.`;

        if (foldedPile || specialPlay) {
          nextTurn = "player";
          message = "You folded the pile. You get another turn!";
        }

        setGameState((prevState) => ({
          ...prevState,
          playerHand: sortHand(finalPlayerHand),
          deck: finalDeck,
          pile: finalPile,
          currentTurn: nextTurn,
        }));

        if (nextTurn === "computer") {
          setTriggerComputerTurn(true);
        }

        displayMessage(message);
      } else {
        displayMessage(
          `You can't play ${drawnCard.value} of ${drawnCard.suit}. You must pick up the pile. Your turn ends.`
        );
        setGameState((prevState) => ({
          ...prevState,
          playerHand: sortHand([...newPlayerHand, ...prevState.pile]),
          deck: newDeck,
          pile: [],
          currentTurn: "computer",
        }));
        setTriggerComputerTurn(true);
      }
    } else {
      displayMessage(
        "No cards left to draw. You must pick up the pile. Your turn ends."
      );
      setGameState((prevState) => ({
        ...prevState,
        playerHand: sortHand([...prevState.playerHand, ...prevState.pile]),
        deck: newDeck,
        pile: [],
        currentTurn: "computer",
      }));
      setTriggerComputerTurn(true);
    }
  };

  const handleComputerTurnRef = useRef();

  const handleComputerTurn = useCallback(() => {
    console.log("Executing computer's turn");

    setTimeout(() => {
      if (mustPickUpPile(gameState.computerHand, gameState.pile)) {
        setGameMessage(
          "Computer couldn't play and had to pick up the pile. It's your turn."
        );
        setGameState((prevState) => ({
          ...prevState,
          computerHand: [...prevState.computerHand, ...prevState.pile],
          pile: [],
          currentTurn: "player",
        }));
        return;
      }

      const {
        hand: newComputerHand,
        deck: newDeck,
        pile: newPile,
        cardPlayed,
        foldedPile,
        opponentPicksUp,
        playedCard,
      } = computerMove(gameState.computerHand, gameState.pile, gameState.deck);

      let nextTurn = "player";
      let message = "";

      if (newComputerHand.length === 0) {
        message = "The computer has won the game. Better luck next time!";
        nextTurn = "gameOver";
      } else if (opponentPicksUp) {
        message = `Computer played ${playedCard.value} on an empty pile. You must pick it up. Computer gets another turn.`;
        nextTurn = "computer";
      } else if (foldedPile) {
        if (playedCard.value === "10") {
          message =
            "Computer played a 10 and folded the pile. Computer gets another turn.";
        } else if (playedCard.value === "A") {
          message =
            "Computer played an Ace and folded the pile. Computer gets another turn.";
        } else {
          message =
            "Computer played four of a kind and folded the pile. Computer gets another turn.";
        }
        nextTurn = "computer";
      } else if (cardPlayed) {
        if (isDeuce(playedCard)) {
          message = `Computer played a 2. It's your turn.`;
        } else if (Array.isArray(playedCard)) {
          const numberWords = ["", "one", "two", "three", "four"];
          const numberWord =
            numberWords[playedCard.length] || playedCard.length.toString();
          message = `Computer played ${numberWord} ${playedCard[0].value}'s. It's your turn.`;
        } else {
          message = `Computer played a ${playedCard.value} of ${playedCard.suit}. It's your turn.`;
        }
      } else {
        message = "Computer couldn't play. It's your turn.";
      }

      setGameMessage(message);

      setGameState((prevState) => ({
        ...prevState,
        computerHand: newComputerHand,
        playerHand: opponentPicksUp
          ? sortHand(removeDuplicates([...prevState.playerHand, ...newPile]))
          : prevState.playerHand,
        deck: newDeck,
        pile: opponentPicksUp ? [] : newPile,
        currentTurn: nextTurn,
      }));

      if (nextTurn === "computer") {
        console.log("Scheduling next computer turn");
        setTimeout(() => {
          console.log("Executing next computer turn");
          handleComputerTurnRef.current();
        }, 2000);
      }

      if (nextTurn === "gameOver") {
        setGameOver(true);
      }
    }, 2000);
  }, [
    gameState.computerHand,
    gameState.pile,
    gameState.deck,
    gameState.playerHand,
  ]);

  // Assign the callback to the ref after its creation
  handleComputerTurnRef.current = handleComputerTurn;

  useEffect(() => {
    console.log(
      "useEffect triggered. currentTurn:",
      gameState.currentTurn,
      "triggerComputerTurn:",
      triggerComputerTurn
    );
    if (gameState.currentTurn === "computer" && triggerComputerTurn) {
      console.log("Calling handleComputerTurn from useEffect");
      handleComputerTurnRef.current();
      setTriggerComputerTurn(false); // Reset the trigger after initiating the turn
    }
  }, [gameState.currentTurn, triggerComputerTurn]);

  // Handler for when a player chooses to take the pile
  const handleTakePile = () => {
    console.log("Player taking the pile");
    if (gameState.pile.length === 0) {
      setGameMessage("The pile is empty. You can't take it.");
      return;
    }
    setGameState((prevState) => {
      const newPlayerHand = sortHand(
        removeDuplicates([...prevState.playerHand, ...prevState.pile])
      );
      return {
        ...prevState,
        playerHand: newPlayerHand,
        pile: [],
        currentTurn: "computer",
      };
    });
    setGameMessage("You took the pile. It's now the computer's turn.");
    setTriggerComputerTurn(true);
  };

  // Updated helper function to get the top cards info
  const getTopCardsInfo = (pile) => {
    if (pile.length === 0) return "Empty";

    const topCard = pile[pile.length - 1];
    let count = 1;
    let suits = new Set([topCard.suit]);
    for (let i = pile.length - 2; i >= 0; i--) {
      if (pile[i].value === topCard.value) {
        count++;
        suits.add(pile[i].suit);
      } else {
        break;
      }
    }

    if (count === 1) {
      return `${topCard.value} of ${topCard.suit}`;
    } else {
      const suitsStr = Array.from(suits).join(", ");
      return `${count}x ${topCard.value} (${suitsStr})`;
    }
  };

  useEffect(() => {
    const uniqueSortedHand = sortHand(removeDuplicates(gameState.playerHand));
    if (
      JSON.stringify(uniqueSortedHand) !== JSON.stringify(gameState.playerHand)
    ) {
      setGameState((prevState) => ({
        ...prevState,
        playerHand: uniqueSortedHand,
      }));
    }
  }, []); // Empty dependency array

  const displayMessage = (message) => {
    setGameMessage(message);
  };

  const startNewGame = () => {
    const initialState = startGame();
    setGameState({
      ...initialState,
      playerHand: sortHand(initialState.playerHand),
      currentTurn: "player", // Ensure currentTurn is set when starting a new game
    });
    setGameOver(false);
    setSelectedCards([]);
    setGameMessage("New game started. Your turn!");
  };

  // Add this function to check if the game is over
  const isGameOver = () => {
    return (
      gameState.playerHand.length === 0 ||
      gameState.computerHand.length === 0 ||
      gameOver
    );
  };

  // Render the game UI
  return (
    <div className={styles.container}>
      <h1>Paskahousu</h1>
      <div className={styles.gameOverModal}>
        <button className={styles.actionButton} onClick={startNewGame}>
          New Game
        </button>
      </div>

      {/* Message display area */}
      {gameMessage && <div className={styles.messageArea}>{gameMessage}</div>}

      {/* Player's hand */}
      <div className={styles.hand}>
        <h2>Your Hand</h2>
        <div className={styles.cards}>
          {isMounted ? (
            gameState.playerHand.map((card, index) => (
              <button
                key={index}
                className={`${styles.cardButton} ${
                  selectedCards.includes(card) ? styles.selectedCard : ""
                }`}
                onClick={() => handleCardSelect(card)}
                disabled={isGameOver() || gameState.currentTurn !== "player"}
              >
                {card.value} of {card.suit}
              </button>
            ))
          ) : (
            <p>Loading...</p>
          )}
        </div>
        <button
          className={styles.selectButton}
          onClick={handlePlayCards}
          disabled={
            selectedCards.length === 0 ||
            isGameOver() ||
            gameState.currentTurn !== "player"
          }
        >
          Play Selected Cards
        </button>
      </div>

      {/* Game controls */}
      <div className={styles.controls}>
        <button
          className={styles.actionButton}
          onClick={handleDrawCard}
          disabled={
            isGameOver() ||
            gameState.currentTurn !== "player" ||
            gameState.deck.length === 0
          }
        >
          Draw Card
        </button>
        <button
          className={styles.actionButton}
          onClick={handleTakePile}
          disabled={
            isGameOver() ||
            gameState.currentTurn !== "player" ||
            gameState.pile.length === 0
          }
        >
          Take Pile
        </button>
      </div>

      {/* Display the top card of the pile */}
      <div className={styles.pile}>
        <h2>Top of the Pile:</h2>
        <p>{isMounted ? getTopCardsInfo(gameState.pile) : "Loading..."}</p>
        <br></br>
        <p> {gameState.pile.length} cards</p>
      </div>

      {/* Display the number of cards in the computer's hand */}
      <div className={styles.computer}>
        <h2>
          Computer's Hand: {isMounted ? gameState.computerHand.length : "..."}{" "}
          cards
        </h2>
      </div>

      {/* Display the number of cards left in the deck */}
      <div className={styles.deck}>
        <h2>Deck: {isMounted ? gameState.deck.length : "..."} cards</h2>
      </div>
    </div>
  );
}
