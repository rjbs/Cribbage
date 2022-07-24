import chalk from 'chalk';
import prompts from 'prompts';

import {
  GuessingGame, GuessResult, CorrectGuessResult, IncorrectGuessResult,
  Deck, Hand
} from './Cribbage.mjs';

import { PrettyPrinter } from './PrettyPrinter.mjs';

const game = new GuessingGame;

game.prepNextTurn();
let showedHand = false;

while (true) {
  if (!showedHand) {
    console.log(PrettyPrinter.handString(game.currentHand));
    showedHand = false;
  }

  let { guess } = await prompts({
    type: 'text',
    name: 'guess',
    message: 'Your guess?'
  });

  if (guess === undefined) break;

  guess = guess.trim();

  // Empty string is just "oops, try again".
  if (guess.length === 0) continue;

  if (guess === "?" || guess === "help") {
    console.log(`
You've got a cribbage hand in front of you.  Score it!

You can just enter a number, or a bunch: "2 2 1" to guess 5.

If you want to say you know exactly the melds in your hand, great!  You can
enter them in compact notation, like "p3n" for "a Pair Royal and His Nobs".
You can put spaces between codes or not, it's up to you!  Here they are:

  n - his nobs
  f - fifteen
  s - a flush in the hand (but not the starter)
  S - a flush across all five cards
  r[3-5] - a run of 3, 4, or 5 cards; you need the number
  p[2-4] - a "pair" of 2, 3, or 4 cards; if no number, it's a pair
`);

    continue;
  }

  const result = game.handleGuess(guess);

  if (result === undefined) {
    console.log("\n❓ I couldn't understand you, sorry!\n");
    continue;
  }

  if (!(result instanceof GuessResult)) {
    throw `Expected a GuessResult but got ${result}`;
  }

  if (result instanceof CorrectGuessResult) {
    console.log(`\n⭐️ You got it! Your streak is now: ${chalk.greenBright(game.streak)}\n`);
  } else if (result instanceof IncorrectGuessResult) {
    console.log(`\n❌ Nope!${result.brief.length ? (" " + result.brief) : ""}\n`);

    if (result.extra) {
      console.log(`${extra}\n`);
    }
  } else {
    throw `How confusing, you got a guess result, but it's neither correct nor incorrect…`;
  }

  console.log(PrettyPrinter.scoreString(game.currentHand.scoreBoard));
  console.log("");

  console.log(chalk.blackBright("┄".repeat(60)));
  game.prepNextTurn();
  showedHand = false;
}

console.log("\nOkay, have fun, bye!");
