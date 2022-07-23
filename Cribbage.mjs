import chalk from 'chalk';

const _suit = {
  Clubs:    { emoji: "♣️", marker: "♣", value: 1 },
  Diamonds: { emoji: "♦️", marker: "♦", value: 2 },
  Hearts:   { emoji: "♥️", marker: "♥", value: 3 },
  Spades:   { emoji: "♠️", marker: "♠", value: 4 },
};


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
  static cardText(card) {
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

    let cardText = template.replaceAll('S', prettySuit)
                           .replace('R', prettyRankLeft)
                           .replace('R', prettyRankRight);

    return cardText;
  }

  static #appendBlocks(blocks) {
    const blockLines = blocks.map(b => b.split(/\n/));

    let appendedText = "";
    for (const i in blockLines[0]) {
      appendedText += blockLines.map(bl => bl[i]).join(" ");
      appendedText += "\n";
    }

    return appendedText;
  }

  static handText(hand) {
    let handText = this.cardText(hand.starter);
    let spacer   = "   \n".repeat(5);
    let blocks   = [
      handText,
      spacer,
      ...hand.cards.map(c => this.cardText(c)),
    ];

    return this.#appendBlocks(blocks);
  }

  static #compactCardText(card) {
    return(card.rank + _suit[ card.suit ].marker);
  }

  static scoreText(scoreBoard) {
    let scoreText = "";

    for (const hit of scoreBoard.hits) {
      scoreText += " ".repeat(hit.score > 9 ? 6 : 7);
      scoreText += `${hit.score}: ${hit.type}`;
      scoreText += " ".repeat(20 - hit.type.length);
      scoreText += hit.cards.map(c => this.#compactCardText(c)).join(" "),
      scoreText += "\n";
    }

    scoreText += `TOTAL: ${scoreBoard.score}`;
    return scoreText;
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

  #didMulti; // found a 2-4 card set of all one rank; key is rank
  #didRun;   // found a 3-5 run; key is lowest card

  constructor(starter, cards) {
    this.starter = starter;
    this.cards = cards;

    this.#didMulti = {};
    this.#didRun = {};
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
    // Using totalOrder here is weird, but will work.  I dunno, I just want to
    // make something that works, okay? -- rjbs, 2022-07-21
    if (set.length >= 3 && !this.#didRun[set[0].totalOrder()]) {
      let isRun = true;
      for (let i = 0; i < set.length - 1; i++) {
        if (set[i].runValue() !== set[i+1].runValue() - 1) {
          isRun = false;
          break;
        }
      }

      if (isRun) {
        const typeName = {
          3: "Run of Three",
          4: "Run of Four",
          5: "Run of Five",
        };

        this.#didRun[ set[0].totalOrder() ] = true;
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

    /// TODO: finalize #scoreBoard
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
