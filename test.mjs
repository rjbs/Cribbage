import { Hand } from './Cribbage.mjs';

const handStrings = [
  '2H  JH QH 2D 5D',
  '2D  JH QH 2H 5H',
  '5D  JD 5C 5S 5H',
  'AD  2D 3D 4D 5D',
  '9D  3D AS JS 8D',
];

for (const handString of handStrings) {
  const hand = Hand.ez(handString);
  console.log(hand.toString());
  console.log(hand.score);
  console.log("");
}

