import * as readline from 'node:readline';
import { Hand } from './Cribbage.mjs';

const rl = readline.createInterface({
  input : process.stdin,
  output: process.stdout,
  prompt: '> ',
});

rl.prompt();

rl.on('line', (rawLine) => {
  const line = rawLine.trim().toUpperCase();

  const hand = Hand.ez(line);
  console.log(hand.toString());
  console.log(hand.score);
  console.log("");

  // This seems wild, probably I want to hang this onto an event loop...
  rl.prompt();
});

