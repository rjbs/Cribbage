import chalk from 'chalk';
import prompts from 'prompts';
import { Deck, Hand, PrettyPrinter } from './Cribbage.mjs';

function lineToHand(line) {
  const hand = Hand.ez(line);

  // console.log(PrettyPrinter.handString(hand));
  // console.log(PrettyPrinter.scoreString(hand.scoreBoard));
  // console.log("");

  return hand;
}

class GuessingGame {
  #deck = (new Deck).shuffle();

  constructor() {
    this.streak = 0;
  }

  prepNextTurn() {
    const cards = this.#deck.pick(5);
    this.currentHand = new Hand(cards[0], cards.slice(1));

    console.log(PrettyPrinter.handString(this.currentHand));

    this.#deck.replace(cards);
    this.#deck.shuffle();
  }

  handleGuess(input) {
    const want = this.currentHand.scoreBoard.score;
    const words = input.split(/\s+/);

    if (!words.find(w => !w.match(/^[0-9]+$/))) {
      const guess = words.reduce((acc, w) => acc + parseInt(w), 0);

      if (words.length > 1) {
        console.log(`You guessed ${guess}.`);
      }

      if (guess === want) {
        this.streak++;
        console.log(`\n⭐️ You got it! Your streak is now: ${chalk.greenBright(this.streak)}\n`);
      } else {
        this.streak = 0;
        console.log(`\n❌ Nope! You were off by ${Math.abs(guess - want)}\n`);
      }

      console.log(PrettyPrinter.scoreString(game.currentHand.scoreBoard));
      console.log("");

      return true;
    }

    console.log("❓ I couldn't understand your guess.");
    return false;
  }
}

const game = new GuessingGame;

game.prepNextTurn();

while (true) {
  let { guess } = await prompts({
    type: 'text',
    name: 'guess',
    message: 'Your guess?'
  });

  if (guess === undefined) break;

  if (guess === "?" || guess === "help") {
    console.log("\nHelp will go here.\n");
    continue;
  }

  if (game.handleGuess(guess.trim().toUpperCase())) {
    console.log(chalk.blackBright("┄".repeat(60)));
    game.prepNextTurn();
  }
}

console.log("\nOkay, have fun, bye!");
