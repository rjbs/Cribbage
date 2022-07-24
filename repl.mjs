import prompts from 'prompts';
import { Deck, Hand, PrettyPrinter } from './Cribbage.mjs';

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

upNext();

while (true) {
  let { guess } = await prompts({
    type: 'text',
    name: 'guess',
    message: 'Your guess?'
  });

  if (guess === undefined) break;

  guess = guess.trim().toUpperCase();

  if (guess == targetScoreBoard.score) {
    console.log("GREAT JOB!");
  } else {
    console.log("Nope!");
  }

  console.log(PrettyPrinter.scoreString(targetScoreBoard));
  console.log("");

  upNext();

  // This seems wild, probably I want to hang this onto an event loop...
}

console.log("\nOkay, have fun, bye!");
