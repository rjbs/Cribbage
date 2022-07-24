import chalk from 'chalk';
import prompts from 'prompts';
import { Deck, Hand, PrettyPrinter } from './Cribbage.mjs';

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

  if (game.handleGuess(guess)) {
    console.log(PrettyPrinter.scoreString(game.currentHand.scoreBoard));
    console.log("");

    console.log(chalk.blackBright("┄".repeat(60)));
    game.prepNextTurn();
    continue;
  }

  console.log("\n❓ I couldn't understand you, sorry!\n");
}

console.log("\nOkay, have fun, bye!");
