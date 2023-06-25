import {TokenType} from "../enums/tokenType";

export class Token {

    readonly token_type: TokenType;
    readonly text: string;
    readonly line: number;
    readonly col: number;
    readonly start: number;
    readonly end: number;
    readonly comments: Array<string>;

    constructor(
        token_type: TokenType,
        text: string,
        line: number = 1,
        col: number = 1,
        start: number = 0,
        end: number = 0,
        comments: Array<string> = []
    ) {
        this.token_type = token_type;
        this.text = text;
        this.line = line;
        this.col = col;
        this.start = start;
        this.end = end;
        this.comments = comments;
    }

    static number(num: number) {
        return new Token(TokenType.NUMBER, String(num));
    }

    static string(str: string) {
        return new Token(TokenType.STRING, str);
    }

    static identifier(id: string) {
        return new Token(TokenType.IDENTIFIER, id);
    }

    static var(vr: string) {
        return new Token(TokenType.VAR, vr);
    }

    appendComments(comments: string[]) {
        this.comments.push(...comments);
    }

    toString() {
        return `<Token ${Object.entries(this).map(([k, v]) => `${k}: ${v}`).join(', ')}>`;
    }
}
