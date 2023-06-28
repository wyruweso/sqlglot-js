import {TokenizerGrammar} from './config/tokenizerGrammar';
import {TokenType} from './enums/tokenType';
import {Trie} from '../common/dataStructure/trie/trie';
import {Token} from './dto/token';

export class Tokenizer {
  private readonly grammar: TokenizerGrammar;
  private readonly encoding: BufferEncoding | null = null;

  private readonly COMMENTS: Record<string, string> = {};
  private readonly FORMAT_STRINGS: Record<string, [string, TokenType]> = {};
  private readonly IDENTIFIERS: Record<string, string> = {};
  private readonly IDENTIFIER_ESCAPES: Set<string> = new Set();
  private readonly QUOTES: Record<string, string> = {};
  private readonly STRING_ESCAPES: Set<string> = new Set();
  private readonly KEYWORD_TRIE: Trie;

  private sql = '';
  private size = 0;
  private tokens: Array<Token> = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private col = 0;
  private comments: string[] = [];
  private char = '';
  private end = false;
  private peeked = '';
  private prevTokenLine = -1;

  constructor(grammar: TokenizerGrammar, encode: BufferEncoding | null = null) {
    this.grammar = grammar;
    this.encoding = encode;

    this.QUOTES = this.convertTuplesToObject(grammar.QUOTES);
    this.IDENTIFIERS = this.convertTuplesToObject(grammar.IDENTIFIERS);

    this.FORMAT_STRINGS = {
      ...['n', 'N'].reduce((acc, p) => {
        const newEntries = Object.entries(this.QUOTES).reduce(
          (acc2, [s, e]) => {
            return {...acc2, [p + s]: [e, TokenType.NATIONAL_STRING]};
          },
          {}
        );
        return {...acc, ...newEntries};
      }, {}),
      ...this.quotesToFormat(TokenType.BIT_STRING, grammar.BIT_STRINGS),
      ...this.quotesToFormat(TokenType.BYTE_STRING, grammar.BYTE_STRINGS),
      ...this.quotesToFormat(TokenType.HEX_STRING, grammar.HEX_STRINGS),
      ...this.quotesToFormat(TokenType.RAW_STRING, grammar.RAW_STRINGS),
    };

    this.STRING_ESCAPES = new Set(grammar.STRING_ESCAPES);
    this.IDENTIFIER_ESCAPES = new Set(grammar.IDENTIFIER_ESCAPES);

    this.COMMENTS = this.convertTuplesToObject(grammar.COMMENTS, '');

    const keywordTrieKeywords = [
      ...Object.keys(grammar.KEYWORDS),
      ...Object.keys(this.COMMENTS),
      ...Object.keys(this.QUOTES),
      ...Object.keys(this.FORMAT_STRINGS),
    ]
      .map(key => key.toUpperCase())
      .filter(
        key =>
          key.includes(' ') ||
          Object.keys(grammar.SINGLE_TOKENS).some(single =>
            key.includes(single)
          )
      );

    this.KEYWORD_TRIE = new Trie(keywordTrieKeywords);
    this.reset();
  }

  reset() {
    this.sql = '';
    this.size = 0;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.col = 0;
    this.comments = [];

    this.char = '';
    this.end = false;
    this.peeked = '';
    this.prevTokenLine = -1;
  }

  convertTuplesToObject(
    tuples: Array<string | Array<string>>,
    nonPairTokensDefaultValue?: string
  ) {
    const convertedObject: Record<string, string> = {};
    tuples.forEach(tuple => {
      if (typeof tuple === 'string') {
        convertedObject[tuple] = nonPairTokensDefaultValue ?? tuple;
      } else {
        convertedObject[tuple[0]] = tuple[1];
      }
    });
    return convertedObject;
  }

  quotesToFormat(tokenType: TokenType, arr: Array<string>) {
    const quotes = this.convertTuplesToObject(arr);
    const result: Record<string, [string, TokenType]> = {};
    for (const [key, value] of Object.entries(quotes)) {
      result[key] = [value, tokenType];
    }
    return result;
  }

  get text(): string {
    return this.sql.substring(this.start, this.current);
  }

  tokenize(sql: string): Array<Token> {
    this.reset();
    this.sql = sql;
    this.size = sql.length;

    try {
      this.scan();
    } catch (e) {
      const start = Math.max(0, this.current - 50);
      const end = Math.min(this.size - 1, this.current + 50);
      const context = this.sql.substring(start, end);

      throw new Error(
        `Error tokenizing '${context}'\n\nOriginal error: ${
          (e as Error).message
        }`
      );
    }

    return this.tokens;
  }

  scan(until: (() => boolean) | null = null) {
    while (this.size && !this.end) {
      this.start = this.current;
      this.advance();

      if (this.char === null) {
        break;
      }

      if (!this.grammar.WHITE_SPACE[this.char]) {
        if (!isNaN(Number(this.char))) {
          this.scanNumber();
        } else if (this.IDENTIFIERS[this.char]) {
          this.scanIdentifier(this.IDENTIFIERS[this.char]);
        } else {
          this.scanKeywords();
        }
      }

      if (until?.()) {
        break;
      }
    }

    if (this.tokens.length && this.comments.length) {
      this.tokens[this.tokens.length - 1].comments.push(...this.comments);
    }
  }

  chars(size: number): string {
    if (size === 1) {
      return this.char;
    }

    const start = this.current - 1;
    const end = start + size;

    return end <= this.size ? this.sql.substring(start, end) : '';
  }

  peek(index = 0): string {
    index = this.current + index;
    if (index < this.size) {
      return this.sql[index];
    }
    return '';
  }

  add(tokenType: TokenType, text: string | null = null) {
    this.prevTokenLine = this.line;
    this.tokens.push(
      new Token(
        tokenType,
        text ?? this.text,
        this.line,
        this.col,
        this.start,
        this.current - 1,
        this.comments
      )
    );
    this.comments = [];

    if (
      this.grammar.COMMANDS.includes(tokenType) &&
      this.peeked !== ';' &&
      (this.tokens.length === 1 ||
        this.grammar.COMMAND_PREFIX_TOKENS.includes(
          this.tokens[this.tokens.length - 2].token_type
        ))
    ) {
      const start = this.current;
      const tokens = this.tokens.length;
      this.scan(() => this.peeked === ';');
      this.tokens = this.tokens.slice(0, tokens);
      const text = this.sql.substring(start, this.current).trim();
      if (text) {
        this.add(TokenType.STRING, text);
      }
    }
  }

  advance(i = 1, alphaNum = false) {
    if (this.grammar.WHITE_SPACE[this.char] === TokenType.BREAK) {
      // check if the current char is a line break to increment the line number
      this.col = 1;
      this.line += 1;
    } else {
      this.col += i;
    }

    this.current += i;
    this.end = this.current >= this.size;
    this.char = this.sql[this.current - 1];
    if (this.char === undefined) {
      throw new Error('string index out of range');
    }

    this.peeked = this.end ? '' : this.sql[this.current];

    if (alphaNum && /\w/.test(this.char)) {
      // Here we use local variables instead of attributes for better performance
      let col = this.col;
      let current = this.current;
      let end = this.end;
      let peek = this.peeked;

      while (/\w/.test(peek)) {
        col += 1;
        current += 1;
        end = current >= this.size;
        peek = end ? '' : this.sql[current];
      }

      this.col = col;
      this.current = current;
      this.end = end;
      this.peeked = peek;
      this.char = this.sql[current - 1];
    }
  }

  scanKeywords() {
    let size = 0;
    let word = null;
    let chars = this.text;
    let char = chars;
    let prevSpace = false;
    let skip = false;
    let trie = this.KEYWORD_TRIE;
    let singleToken = this.grammar.SINGLE_TOKENS[char];
    let result;

    while (chars) {
      if (skip) {
        result = 1;
      } else {
        // assuming `in_trie` is a function defined elsewhere
        [result, trie] = trie.inTrie(char.toUpperCase());
      }

      if (result === 0) {
        break;
      }
      if (result === 2) {
        word = chars;
      }

      size += 1;
      const end = this.current - 1 + size;

      if (end < this.size) {
        char = this.sql[end];
        singleToken = singleToken || this.grammar.SINGLE_TOKENS[char];
        const isSpace = this.grammar.WHITE_SPACE[char];

        if (!isSpace || !prevSpace) {
          if (isSpace) {
            char = ' ';
          }
          chars += char;
          prevSpace = Boolean(isSpace);
          skip = false;
        } else {
          skip = true;
        }
      } else {
        char = '';
        chars = ' ';
      }
    }

    word =
      singleToken || this.grammar.WHITE_SPACE[chars[chars.length - 1]]
        ? word
        : null;

    if (!word) {
      if (this.char in this.grammar.SINGLE_TOKENS) {
        this.add(this.grammar.SINGLE_TOKENS[this.char], this.char);
        return;
      }
      this.scanVar();
      return;
    }

    if (this.scanString(word)) {
      return;
    }
    if (this.scanComment(word)) {
      return;
    }

    this.advance(size - 1);
    word = word.toUpperCase();
    this.add(this.grammar.KEYWORDS[word], word);
  }

  scanComment(commentStart: string): boolean {
    if (!(commentStart in this.COMMENTS)) {
      return false;
    }

    const commentStartLine = this.line;
    const commentStartSize = commentStart.length;
    const commentEnd = this.COMMENTS[commentStart];

    if (commentEnd) {
      // Skip the comment's start delimiter
      this.advance(commentStartSize);

      const commentEndSize = commentEnd.length;
      while (!this.end && this.chars(commentEndSize) !== commentEnd) {
        this.advance(1, true);
      }

      this.comments.push(
        this.text.substring(
          commentStartSize,
          this.text.length - commentEndSize + 1
        )
      );
      this.advance(commentEndSize - 1);
    } else {
      while (
        !this.end &&
        !this.grammar.WHITE_SPACE[this.peeked] &&
        this.grammar.WHITE_SPACE[this.peeked] !== TokenType.BREAK
      ) {
        this.advance(1, true);
      }
      this.comments.push(this.text.substring(commentStartSize));
    }

    if (commentStartLine === this.prevTokenLine) {
      const tokenToUpdate = this.tokens[this.tokens.length - 1];
      tokenToUpdate.appendComments(this.comments);
      this.comments = [];
      this.prevTokenLine = this.line;
    }

    return true;
  }

  scanNumber() {
    if (this.char === '0') {
      const peek = this.peek().toUpperCase();
      if (peek === 'B') {
        return this.grammar.BIT_STRINGS
          ? this.scanBits()
          : this.add(TokenType.NUMBER);
      } else if (peek === 'X') {
        return this.grammar.HEX_STRINGS
          ? this.scanHex()
          : this.add(TokenType.NUMBER);
      }
    }

    let decimal = false;
    let scientific = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!isNaN(Number(this.peek()))) {
        this.advance();
      } else if (this.peek() === '.' && !decimal) {
        const after = this.peek(1);
        if (!isNaN(Number(after)) || !/\w/.test(after)) {
          decimal = true;
          this.advance();
        } else {
          return this.add(TokenType.VAR);
        }
      } else if (['-', '+'].includes(this.peek()) && scientific === 1) {
        scientific++;
        this.advance();
      } else if (this.peek().toUpperCase() === 'E' && !scientific) {
        scientific++;
        this.advance();
      } else if (/\w/.test(this.peek())) {
        const number_text = this.text;
        let literal = '';

        while (
          this.peek().trim() &&
          !(this.peek() in this.grammar.SINGLE_TOKENS)
        ) {
          literal += this.peek().toUpperCase();
          this.advance();
        }

        const token_type =
          this.grammar.KEYWORDS[this.grammar.NUMERIC_LITERALS[literal] || ''];

        if (token_type) {
          this.add(TokenType.NUMBER, number_text);
          this.add(TokenType.DCOLON, '::');
          return this.add(token_type, literal);
        } else if (this.grammar.IDENTIFIERS_CAN_START_WITH_DIGIT) {
          return this.add(TokenType.VAR);
        }

        this.add(TokenType.NUMBER, number_text);
        return this.advance(-literal.length);
      } else {
        return this.add(TokenType.NUMBER);
      }
    }
  }

  scanBits() {
    this.advance();
    const value = this.extractValue();
    const parsedValue = Number(value);

    if (isNaN(parsedValue) || parsedValue.toString(2) !== value.substring(2)) {
      //  If `value` can't be converted to a binary, fallback to tokenizing it as an identifier
      this.add(TokenType.IDENTIFIER);
    } else {
      this.add(TokenType.BIT_STRING, value.substring(2)); // Drop the 0b
    }
  }

  scanHex() {
    this.advance();
    const value = this.extractValue();
    const parsedValue = Number(value);

    if (
      isNaN(parsedValue) ||
      parsedValue.toString(16) !== value.substring(16)
    ) {
      //  If `value` can't be converted to a hex, fallback to tokenizing it as an identifier
      this.add(TokenType.IDENTIFIER);
    } else {
      this.add(TokenType.HEX_STRING, value.substring(2)); // Drop the 0x
    }
  }

  extractValue(): string {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const char = this.peeked.trim();
      if (char && !(char in this.grammar.SINGLE_TOKENS)) {
        this.advance(1, true);
      } else {
        break;
      }
    }
    return this.text;
  }

  scanString(start: string): boolean {
    let base = null;
    let tokenType = TokenType.STRING;
    let end;

    if (start in this.QUOTES) {
      end = this.QUOTES[start];
    } else if (start in this.FORMAT_STRINGS) {
      [end, tokenType] = this.FORMAT_STRINGS[start];

      if (tokenType === TokenType.HEX_STRING) {
        base = 16;
      } else if (tokenType === TokenType.BIT_STRING) {
        base = 2;
      }
    } else {
      return false;
    }

    this.advance(start.length);
    let text = this.extractString(end);

    if (base) {
      if (isNaN(parseInt(text, base))) {
        //check, possible bug
        throw new Error(
          `Numeric string contains invalid characters from line ${this.line}:${this.start}`
        );
      }
    } else {
      text = this.encoding ? Buffer.from(text).toString(this.encoding) : text;
    }

    this.add(tokenType, text);
    return true;
  }

  scanIdentifier(identifierEnd: string) {
    this.advance();
    const text = this.extractString(identifierEnd, this.IDENTIFIER_ESCAPES);
    this.add(TokenType.IDENTIFIER, text);
  }

  scanVar() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const char = this.peeked.trim();
      if (
        char &&
        (this.grammar.VAR_SINGLE_TOKENS[char] ||
          !this.grammar.SINGLE_TOKENS[char])
      ) {
        this.advance(1, true);
      } else {
        break;
      }
    }
    const tokenType =
      this.tokens?.[this.tokens.length - 1]?.token_type === TokenType.PARAMETER
        ? TokenType.VAR
        : this.grammar.KEYWORDS[this.text.toUpperCase()] || TokenType.VAR;

    this.add(tokenType);
  }

  extractString(delimiter: string, escapes: Set<string> | null = null): string {
    let text = '';
    const delimSize = delimiter.length;
    escapes = escapes ?? this.STRING_ESCAPES;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (
        escapes.has(this.char) &&
        (this.peeked === delimiter || escapes.has(this.peeked))
      ) {
        if (this.peeked === delimiter) {
          text += this.peeked;
        } else {
          text += this.char + this.peeked;
        }
        if (this.current + 1 < this.size) {
          this.advance(2);
        } else {
          throw new Error(
            `Missing ${delimiter} from line ${this.line}:${this.current}`
          );
        }
      } else {
        if (this.chars(delimSize) === delimiter) {
          if (delimSize > 1) {
            this.advance(delimSize - 1);
          }
          break;
        }
        if (this.end) {
          throw new Error(
            `Missing ${delimiter} from line ${this.line}:${this.start}`
          );
        }
        const current = this.current - 1;
        this.advance(1, true);
        text += this.sql.substring(current, this.current - 1);
      }
    }
    return text;
  }
}
