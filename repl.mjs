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

  #handleRight() {
    this.streak++;
    console.log(`\n⭐️ You got it! Your streak is now: ${chalk.greenBright(this.streak)}\n`);
  }

  #handleWrong(brief, extra) {
    this.streak = 0;
    console.log(`\n❌ Nope!${brief.length ? (" " + brief) : ""}\n`);

    if (extra) {
      console.log(`${extra}\n`);
    }
  }

  #handleNumericGuess(words) {
    const guess = words.reduce((acc, w) => acc + parseInt(w), 0);
    const want  = this.currentHand.scoreBoard.score;

    if (words.length > 1) {
      console.log(`You guessed ${guess}.`);
    }

    if (guess === want) {
      this.#handleRight();
    } else {
      this.#handleWrong(`You were off by ${Math.abs(guess - want)}`);
    }

    return true;
  }

  #handleHandGuess(words) {
    const typeFor = {
      n:  { type: "Nobs",               score: 1 },
      f:  { type: "Fifteen",            score: 2 },
      s:  { type: "Hand Flush",         score: 4 },
      S:  { type: "Five Card Flush",    score: 5 },
      r3: { type: "Run of Three",       score: 3 },
      r4: { type: "Run of Four",        score: 4 },
      r5: { type: "Run of Five",        score: 5 },
      p:  { type: "Pair",               score: 2 },
      p2: { type: "Pair",               score: 2 },
      p3: { type: "Pair Royal",         score: 6 },
      p4: { type: "Double Pair Royal",  score: 12 },
    };

    const combined = words.join("");
    const parse = Array.from(combined.matchAll(/(f|n|s|S|r[0-9]|p[2-4]?)/g))
                       .map(m => m[0]);

    if (combined.length !== parse.join("").length) {
      console.log("\nSorry, something's weird about your guess.\n");
      return false;
    }

    let guess = 0;
    const expectedTypeCount = {};

    for (const token of parse) {
      if (!typeFor[token]) throw "Unexpected parse token!?";

      guess += typeFor[token].score;
      expectedTypeCount[ typeFor[token].type ] ||= 0;
      expectedTypeCount[ typeFor[token].type ]++;
    }

    for (const hit of this.currentHand.scoreBoard.hits) {
      expectedTypeCount[ hit.type ] ||= 0;
      expectedTypeCount[ hit.type ]--;
    }

    const keys = Array.from(Object.keys(expectedTypeCount));
    keys.sort();

    let sawError = false;
    let extra = "";

    for (const type of keys) {
      if (expectedTypeCount[type] == 0) continue;
      sawError = true;

      const verb = expectedTypeCount[type] > 0 ? 'overcounted' : 'missed';
      extra += `${type}: You ${verb} ${Math.abs(expectedTypeCount[type])}\n`;
    }

    const want = this.currentHand.scoreBoard.score;
    const message = guess == want
                  ? "You got the right score, but the wrong hands."
                  : `You were off by ${Math.abs(guess - want)}`;

    if (!sawError && guess == want) {
      this.#handleRight();
    } else {
      this.#handleWrong(message, extra);
    }

    return true;
    return true;
  }

  handleGuess(input) {
    const words = input.split(/\s+/);

    if (!words.find(w => !w.match(/^[0-9]+$/))) {
      // Guess Type One: "1" or "1 2 3" (meaning 6)
      return this.#handleNumericGuess(words);
    }

    if (this.#handleHandGuess(words)) {
      // Guess Type Two: fffn (meaning 3 fifteens and nobs)
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

  if (game.handleGuess(guess.trim())) {
    console.log(PrettyPrinter.scoreString(game.currentHand.scoreBoard));
    console.log("");

    console.log(chalk.blackBright("┄".repeat(60)));
    game.prepNextTurn();
  }
}

console.log("\nOkay, have fun, bye!");
