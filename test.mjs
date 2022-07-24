import chalk from 'chalk';
import { Hand, PrettyPrinter } from './Cribbage.mjs';

const handStrings = [
  '2H  JH QH 2D 5D',
  '2D  JH QH 2H 5H',
  '5D  JD 5C 5S 5H',
  'AD  2D 3D 4D 5D',
  '9D  3D AS JS 8D',
  '5D  3H 2D 4C 8S', // should be 8 not 11
  '5D  3H 2D 4C 5S', // two runs of 4, a 15, and a pair; should be 12
];

for (const handString of handStrings) {
  const hand = Hand.ez(handString);
  console.log(PrettyPrinter.handString(hand));
  console.log(PrettyPrinter.scoreString(hand.scoreBoard));
  console.log(chalk.blackBright("┄".repeat(48)));
  console.log("");
}

