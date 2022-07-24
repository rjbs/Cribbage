import chalk from 'chalk';

const _suit = {
  Clubs:    { emoji: "♣️", marker: "♣", value: 1 },
  Diamonds: { emoji: "♦️", marker: "♦", value: 2 },
  Hearts:   { emoji: "♥️", marker: "♥", value: 3 },
  Spades:   { emoji: "♠️", marker: "♠", value: 4 },
};

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

    if (scoreBoard.hits.length !== 0) {
      scoreString += chalk.blackBright("  " + "─".repeat(44)) + "\n";
    }

    scoreString += " ".repeat(23);
    scoreString += `TOTAL ${chalk.blackBright("..............")}`;
    scoreString += " ".repeat(scoreBoard.score > 9 ? 1 : 2);
    scoreString += `${scoreBoard.score}\n`;

    return scoreString;
  }
}

