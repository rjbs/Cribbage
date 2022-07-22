class Card {
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
    const suitMarker = {
      Clubs: 1,
      Diamonds: 2,
      Hearts: 3,
      Spades: 4,
    };

    return this.runValue() * 10 + suitMarker[this.suit];
  }

  toString() {
    const suitMarker = {
      Clubs: "♣️",
      Diamonds: "♦️",
      Hearts: "♥️",
      Spades: "♠️",
    };

    return(this.rank + suitMarker[ this.suit ]);
  }
}

class Hand {
  #score;
  #scoreBoard;

  #didMulti; // found a 2-4 card set of all one rank; key is rank
  #didRun;   // found a 3-5 run; key is lowest card

  constructor(starter, cards) {
    this.starter = starter;
    this.cards = cards;

    this.#scoreBoard = [];
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
      this.#scoreBoard.push({
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

      this.#scoreBoard.push({
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
        this.#scoreBoard.push({
          type : typeName[set.length],
          cards: set,
          score: set.length,
        });
      }
    }
  }

  #considerFifteens(set) {
    if (set.reduce((i, c) => i + c.sumValue(), 0) === 15) {
      this.#scoreBoard.push({
        type : "Fifteen",
        cards: set,
        score: 2,
      });
    }
  }

  #considerFiveCardFlush(set) {
    if (set.length === 5 && this.#allLike(set, c => c.suit === set[0].suit)) {
      this.#scoreBoard.push({
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
      this.#scoreBoard.push({
        type : "Hand Flush",
        cards: this.cards,
        score: 4,
      });
    }
  }

  get score() {
    if (this.#score !== undefined) return this.#score;

    this.#considerNobs();
    this.#considerHandFlush();

    for (const set of this.#sortedSubsets) {
      this.#considerMultiples(set);
      this.#considerRuns(set);
      this.#considerFifteens(set);
      this.#considerFiveCardFlush(set);
    }

    this.#score = {
      score: this.#scoreBoard.reduce((i, hit) => hit.score + i, 0),
      via  : this.#scoreBoard,
    };

    return this.#score;
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