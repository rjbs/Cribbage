import * as readline from 'node:readline';
import { Deck, Hand, PrettyPrinter } from './Cribbage.mjs';

const rl = readline.createInterface({
  input : process.stdin,
  output: process.stdout,
  prompt: '> ',
});

function lineToHand(line) {
  const hand = Hand.ez(line);

  // console.log(PrettyPrinter.handString(hand));
  // console.log(PrettyPrinter.scoreString(hand.scoreBoard));
  // console.log("");

  return hand;
}

const deck = new Deck;
deck.shuffle();

let targetScoreBoard;
function upNext() {
  const cards = deck.pick(5);
  const hand = new Hand(cards[0], cards.slice(1));

  console.log(PrettyPrinter.handString(hand));
  targetScoreBoard = hand.scoreBoard;

  deck.replace(cards);
  deck.shuffle();
}

rl.on('close', () => { console.log("\n\nOkay, have fun, bye!") });

rl.on('line', (rawLine) => {
  const line = rawLine.trim().toUpperCase();

  if (line == targetScoreBoard.score) {
    console.log("GREAT JOB!");
  } else {
    console.log("Nope!");
  }

  console.log(PrettyPrinter.scoreString(targetScoreBoard));
  console.log("");

  upNext();

  // This seems wild, probably I want to hang this onto an event loop...
  rl.prompt();
});

upNext();
rl.prompt();

