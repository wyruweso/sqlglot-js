import {TokenType} from "../enums/tokenType";
import {SingleTokenConfig} from "./types/singleTokenConfig";
import {KeywordConfig} from "./types/keywordConfig";
import {WhitespaceConfig} from "./types/whitespaceConfig";
import {CommentConfig} from "./types/commentConfig";
import {VarSingleTokenConfig} from "./types/varSingleTokenConfig";

export class TokenizerGrammar {

    readonly SINGLE_TOKENS: SingleTokenConfig;
    readonly BIT_STRINGS: string[];
    readonly BYTE_STRINGS: string[];
    readonly HEX_STRINGS: string[];
    readonly RAW_STRINGS: string[];
    readonly IDENTIFIERS: string[];
    readonly IDENTIFIER_ESCAPES: string[];
    readonly QUOTES: string[];
    readonly STRING_ESCAPES: string[];
    readonly VAR_SINGLE_TOKENS: VarSingleTokenConfig;

    // Autofilled
    readonly IDENTIFIERS_CAN_START_WITH_DIGIT: boolean;

    readonly KEYWORDS: KeywordConfig;
    readonly WHITE_SPACE: WhitespaceConfig;
    readonly COMMANDS: Array<TokenType>;
    readonly COMMAND_PREFIX_TOKENS: Array<TokenType>;

    // handle numeric literals like in hive (3L = BIGINT)
    readonly NUMERIC_LITERALS: Record<string, string>;
    readonly COMMENTS: CommentConfig;

    private constructor(
        SINGLE_TOKENS: SingleTokenConfig,
        BIT_STRINGS: string[],
        BYTE_STRINGS: string[],
        HEX_STRINGS: string[],
        RAW_STRINGS: string[],
        IDENTIFIERS: string[],
        IDENTIFIER_ESCAPES: string[],
        QUOTES: string[],
        STRING_ESCAPES: string[],
        VAR_SINGLE_TOKENS: VarSingleTokenConfig,
        IDENTIFIERS_CAN_START_WITH_DIGIT: boolean,
        KEYWORDS: KeywordConfig,
        WHITE_SPACE: WhitespaceConfig,
        COMMANDS: Array<TokenType>,
        COMMAND_PREFIX_TOKENS: Array<TokenType>,
        NUMERIC_LITERALS: Record<string, string>,
        COMMENTS: CommentConfig,
    ) {
        this.SINGLE_TOKENS = SINGLE_TOKENS;
        this.BIT_STRINGS = BIT_STRINGS;
        this.BYTE_STRINGS = BYTE_STRINGS;
        this.HEX_STRINGS = HEX_STRINGS;
        this.RAW_STRINGS = RAW_STRINGS;
        this.IDENTIFIERS = IDENTIFIERS;
        this.IDENTIFIER_ESCAPES = IDENTIFIER_ESCAPES;
        this.QUOTES = QUOTES;
        this.STRING_ESCAPES = STRING_ESCAPES;
        this.VAR_SINGLE_TOKENS = VAR_SINGLE_TOKENS;
        this.IDENTIFIERS_CAN_START_WITH_DIGIT = IDENTIFIERS_CAN_START_WITH_DIGIT;
        this.KEYWORDS = KEYWORDS;
        this.WHITE_SPACE = WHITE_SPACE;
        this.COMMANDS = COMMANDS;
        this.COMMAND_PREFIX_TOKENS = COMMAND_PREFIX_TOKENS;
        this.NUMERIC_LITERALS = NUMERIC_LITERALS;
        this.COMMENTS = COMMENTS;
    }

    static readonly TokenizerGrammarBuilder = class {
        #SINGLE_TOKENS: SingleTokenConfig = {};
        #BIT_STRINGS: string[] = [];
        #BYTE_STRINGS: string[] = [];
        #HEX_STRINGS: string[] = [];
        #RAW_STRINGS: string[] = [];
        #IDENTIFIERS: string[] = [];
        #IDENTIFIER_ESCAPES: string[] = [];
        #QUOTES: string[] = [];
        #STRING_ESCAPES: string[] = [];
        #VAR_SINGLE_TOKENS: VarSingleTokenConfig = {};
        #IDENTIFIERS_CAN_START_WITH_DIGIT: boolean = false;
        #KEYWORDS: KeywordConfig = {};
        #WHITE_SPACE: WhitespaceConfig = {};
        #COMMANDS: Array<TokenType> = [];
        #COMMAND_PREFIX_TOKENS: Array<TokenType> = [];
        #NUMERIC_LITERALS: Record<string, string> = {};
        #COMMENTS: CommentConfig = [];

        constructor() {
        }

        static getInstance() {
            return new TokenizerGrammar.TokenizerGrammarBuilder();
        }

        build(): TokenizerGrammar {
            return new TokenizerGrammar(
                this.#SINGLE_TOKENS,
                this.#BIT_STRINGS,
                this.#BYTE_STRINGS,
                this.#HEX_STRINGS,
                this.#RAW_STRINGS,
                this.#IDENTIFIERS,
                this.#IDENTIFIER_ESCAPES,
                this.#QUOTES,
                this.#STRING_ESCAPES,
                this.#VAR_SINGLE_TOKENS,
                this.#IDENTIFIERS_CAN_START_WITH_DIGIT,
                this.#KEYWORDS,
                this.#WHITE_SPACE,
                this.#COMMANDS,
                this.#COMMAND_PREFIX_TOKENS,
                this.#NUMERIC_LITERALS,
                this.#COMMENTS
            );
        }

        setSingleTokens(value: SingleTokenConfig) {
            this.#SINGLE_TOKENS = value;
            return this;
        }

        setBitStrings(value: string[]) {
            this.#BIT_STRINGS = value;
            return this;
        }

        setByteStrings(value: string[]) {
            this.#BYTE_STRINGS = value;
            return this;
        }

        setHexStrings(value: string[]) {
            this.#HEX_STRINGS = value;
            return this;
        }

        setRawStrings(value: string[]) {
            this.#RAW_STRINGS = value;
            return this;
        }

        setIdentifiers(value: string[]) {
            this.#IDENTIFIERS = value;
            return this;
        }

        setIdentifierEscapes(value: string[]) {
            this.#IDENTIFIER_ESCAPES = value;
            return this;
        }

        setQuotes(value: string[]) {
            this.#QUOTES = value;
            return this;
        }

        setStringEscapes(value: string[]) {
            this.#STRING_ESCAPES = value;
            return this;
        }

        setVarSingleTokens(value: VarSingleTokenConfig) {
            this.#VAR_SINGLE_TOKENS = value;
            return this;
        }

        setIdentifiersCanStartWithADigit(value: boolean) {
            this.#IDENTIFIERS_CAN_START_WITH_DIGIT = value;
            return this;
        }

        setKeywords(value: KeywordConfig) {
            this.#KEYWORDS = value;
            return this;
        }

        setWhiteSpace(value: WhitespaceConfig) {
            this.#WHITE_SPACE = value;
            return this;
        }

        setCommands(value: Array<TokenType>) {
            this.#COMMANDS = value;
            return this;
        }

        setCommandPrefixTokens(value: Array<TokenType>) {
            this.#COMMAND_PREFIX_TOKENS = value;
            return this;
        }

        setNumericLiterals(value: Record<string, string>) {
            this.#NUMERIC_LITERALS = value;
            return this;
        }

        setComments(value: CommentConfig) {
            this.#COMMENTS = value;
            return this;
        }

    }

}
