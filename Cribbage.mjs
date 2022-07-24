import chalk from 'chalk';

const _suit = {
  Clubs:    { emoji: "♣️", marker: "♣", value: 1 },
  Diamonds: { emoji: "♦️", marker: "♦", value: 2 },
  Hearts:   { emoji: "♥️", marker: "♥", value: 3 },
  Spades:   { emoji: "♠️", marker: "♠", value: 4 },
};

const _ranks = [
  "A",
  "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "J", "Q", "K",
];

export class Deck {
  constructor() {
    this._cards = [];
    for (const suit of Object.keys(_suit)) {
      for (const rank of _ranks) {
        this._cards.push(new Card(rank, suit));
      }
    }
  }

  shuffle() {
    let newCards = [];
    while (this._cards.length > 0) {
      const next = Math.floor(Math.random() * this._cards.length);
      newCards.push(...this._cards.splice(next, 1));
    }

    this._cards = newCards;
    return this;
  }

  pick(n) {
    if (n > this._cards.length) 1/0;
    return this._cards.splice(0, n);
  }

  replace(cards) {
    // Like many other bits, this does nothing to ensure you're not bringing in
    // bogus cards. -- rjbs, 2022-07-23
    this._cards = this._cards.concat(cards);
  }
}

export class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
  }

  sumValue() {
    if (this.rank === 'K' || this.rank === 'Q' || this.rank === 'J') {
      return 10;
    }

    if (this.rank === 'A') {
      return 1;
    }

    return parseInt(this.rank);
  }

  runValue() {
    if (this.rank === 'A') return 1;
    if (this.rank === 'K') return 13;
    if (this.rank === 'Q') return 12;
    if (this.rank === 'J') return 11;

    return parseInt(this.rank);
  }

  totalOrder() {
    return this.runValue() * 10 + _suit[this.suit].value;
  }

  toString() {
    return(this.rank + _suit[ this.suit ].emoji);
  }
}

export class PrettyPrinter {
  static cardString(card) {
    const template = `╭─────╮
│R   │
│  S  │
│   R│
╰─────╯`;

    let rank = card.rank;
    if (rank === "A") rank = " ";

    let prettyRank = chalk.bold.whiteBright(rank);
    let prettyRankLeft  = prettyRank;
    let prettyRankRight = prettyRank;
    if (rank !== "10") prettyRankLeft += " ";
    if (rank !== "10") prettyRankRight = " " + prettyRankRight;

    let prettySuit = _suit[card.suit].marker;
    if (card.suit === 'Hearts' || card.suit === 'Diamonds') {
      prettySuit = chalk.redBright(prettySuit);
    } else {
      prettySuit = chalk.blackBright(prettySuit);
    }

    let cardString = template.replaceAll('S', prettySuit)
                           .replace('R', prettyRankLeft)
                           .replace('R', prettyRankRight);

    return cardString;
  }

  static #appendBlocks(blocks) {
    const blockLines = blocks.map(b => b.split(/\n/));

    let appendedString = "";
    for (const i in blockLines[0]) {
      appendedString += blockLines.map(bl => bl[i]).join(" ");
      appendedString += "\n";
    }

    return appendedString;
  }

  static handString(hand) {
    let leader   = " \n".repeat(5);
    let handString = this.cardString(hand.starter);
    let spacer   = "    \n".repeat(5);
    let blocks   = [
      leader,
      handString,
      spacer,
      ...hand.cards.map(c => this.cardString(c)),
    ];

    return this.#appendBlocks(blocks);
  }

  static #compactCardString(card) {
    const colorer = card.suit === "Hearts" || card.suit === "Diamonds"
                  ? chalk.redBright
                  : chalk.blackBright;

    return(colorer(card.rank + _suit[ card.suit ].marker));
  }

  static scoreString(scoreBoard) {
    let scoreString = "";

    for (const hit of scoreBoard.hits) {
      //  123456789012456
      //  6♠ 9♣          Fifteen .........  2
      //  6♣ 9♣          Fifteen .........  2
      //  6♣ 6♠          Pair ............  2
      //  5♣ 10♠         Fifteen .........  2
      //  ───────────────────────────────────
      //                 TOTAL ...........  6

      // We want allocate four spaces for each card, so 20 followed by a
      // space before the type. Spaces used is: 3*cards + 1*tens
      //
      // Type is followed by space, then dots to pad to
      // 20, then space, then space for two digit score right justified.
      scoreString += "  ";

      let effectiveWidth = 3 * hit.cards.length
                         + hit.cards.filter(c => c.rank === "10").length

      scoreString += hit.cards.map(c => this.#compactCardString(c)).join(" ");
      scoreString += " ".repeat(21 - effectiveWidth);

      scoreString += ` ${hit.type} `;
      scoreString += chalk.blackBright(".".repeat(19 - hit.type.length));

      scoreString += " ".repeat(hit.score > 9 ? 1 : 2);
      scoreString += `${hit.score}`;
      scoreString += "\n";
    }

    if (scoreBoard.hits.length !== 1) {
      if (scoreBoard.hits.length !== 0) {
        scoreString += chalk.blackBright("  " + "─".repeat(44)) + "\n";
      }

      scoreString += " ".repeat(23);
      scoreString += `TOTAL ${chalk.blackBright("..............")}`;
      scoreString += " ".repeat(scoreBoard.score > 9 ? 1 : 2);
      scoreString += `${scoreBoard.score}\n`;
    }

    return scoreString;
  }
}

export class ScoreBoard {
  #finalized = false;

  constructor () {
    this._scores = [];
  }

  addScore(hit) {
    if (this.#finalized) 1/0;

    this._scores.push(hit);
  }

  finalize() {
    this.#finalized = true;
  }

  get hits() {
    return [ ...this._scores ]; // Unhappy with this. -- rjbs, 2022-07-23
  }

  get score() {
    return this._scores.reduce((i, hit) => hit.score + i, 0);
  }
}

export class Hand {
  #scoreBoard;

  #didMulti = {};    // found a 2-4 card set of all one rank; key is rank
  #didRun = new Set; // found a 3-5 run; this is a Set with all cards in runs

  constructor(starter, cards) {
    this.starter = starter;
    this.cards = cards;
  }

  static ez (handString) {
    // Total hack. -- rjbs, 2022-07-21
    const pairs = handString.split(/\s+/);

    let cards = [];

    const suitFor = {
      C: "Clubs",
      D: "Diamonds",
      H: "Hearts",
      S: "Spades",
    };

    for (const pair of pairs) {
      let [rank, suit] = pair;
      if (rank === 'T') rank = '10';

      cards.push(new Card(rank, suitFor[suit]));
    }

    return new Hand(cards[0], cards.slice(1));
  }

  #powerSet(arr) {
    // This is a naive implementation of power set, but since we have exactly 5
    // elements, it won't matter. -- rjbs, 2022-07-21
    const totalCount = 2 ** arr.length;
    const bits = arr.map((_, i) => 2 ** i);

    let powerSet = [];

    for (let i = 1; i < totalCount; i++) {
      powerSet.push(
        bits.flatMap((b,j) => i & b ? arr[j] : [])
      )
    }

    return powerSet;
  }

  get #sortedSubsets() {
    const allSets = this.#powerSet([ this.starter, ...this.cards ]);
    allSets.forEach(set => set.sort((a,b) => a.totalOrder() - b.totalOrder()));
    allSets.sort((a,b) => b.length - a.length);
    return allSets;
  }

  #howMany(set, test) { return set.filter(test).length; }
  #allLike(set, test) { return this.#howMany(set, test) == set.length; }

  #considerNobs() {
    const wantSuit = this.starter.suit;

    const nobs = this.cards.find(c => c.rank === 'J' && c.suit === wantSuit);

    if (nobs) {
      this.#scoreBoard.addScore({
        type : "Nobs",
        cards: [ this.starter, nobs ],
        score: 1,
      });
    }
  }

  #considerMultiples(set) {
    if (
      set.length >= 2
      && !this.#didMulti[ set[0].rank ]
      && this.#allLike(set, c => c.rank === set[0].rank)
    ) {
      this.#didMulti[ set[0].rank ] = true;

      const typeName = {
        2: "Pair",
        3: "Pair Royal",
        4: "Double Pair Royal",
      };

      this.#scoreBoard.addScore({
        type : typeName[set.length],
        subtype: set[0].rank,
        cards: set,
        score: set.length * (set.length - 1) // 2, 6, 12
      });
    }
  }

  #considerRuns(set) {
    if (set.length >= 3) {
      let isRun = true;
      for (let i = 0; i < set.length - 1; i++) {
        if (set[i].runValue() !== set[i+1].runValue() - 1) {
          isRun = false;
          break;
        }
      }

      if (isRun && !this.#allLike(set,c => this.#didRun.has(c))) {
        const typeName = {
          3: "Run of Three",
          4: "Run of Four",
          5: "Run of Five",
        };

        set.forEach(c => this.#didRun.add(c));
        this.#scoreBoard.addScore({
          type : typeName[set.length],
          cards: set,
          score: set.length,
        });
      }
    }
  }

  #considerFifteens(set) {
    if (set.reduce((i, c) => i + c.sumValue(), 0) === 15) {
      this.#scoreBoard.addScore({
        type : "Fifteen",
        cards: set,
        score: 2,
      });
    }
  }

  #considerFiveCardFlush(set) {
    if (set.length === 5 && this.#allLike(set, c => c.suit === set[0].suit)) {
      this.#scoreBoard.addScore({
        type : "Five Card Flush",
        cards: set,
        score: 5,
      });
    }
  }

  #considerHandFlush() {
    if ( this.starter.suit !== this.cards[0].suit
      && this.#allLike(this.cards, c => c.suit === this.cards[0].suit)
    ) {
      this.#scoreBoard.addScore({
        type : "Hand Flush",
        cards: this.cards,
        score: 4,
      });
    }
  }

  get score() {
    this.scoreBoard.score;
  }

  get scoreBoard() {
    if (this.#scoreBoard !== undefined) return this.#scoreBoard;
    this.#scoreBoard = new ScoreBoard()

    this.#considerNobs();
    this.#considerHandFlush();

    for (const set of this.#sortedSubsets) {
      this.#considerMultiples(set);
      this.#considerRuns(set);
      this.#considerFifteens(set);
      this.#considerFiveCardFlush(set);
    }

    this.#scoreBoard.finalize();
    return this.#scoreBoard;
  }

  toString() {
    let string = this.starter.toString();
    string += "  |";

    for (const card of this.cards) {
      string += "  ";
      string += card.toString();
    }

    return string;
  }
}
