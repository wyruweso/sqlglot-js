import 'mocha';
import {expect} from 'chai';
import {defaultTokenizerGrammar} from '../../src/tokenizer/config/dialect/defaultTokenizerGrammar';
import {Tokenizer} from '../../src/tokenizer/tokenizer';

describe('Test basic tokenizer', () => {
  it('should attach comments to tokens', () => {
    const tokenizer = new Tokenizer(defaultTokenizerGrammar);
    const tokens = tokenizer.tokenize('/*comment*/ foo');
    expect(tokens[0].comments).to.be.deep.equal(['comment']);

    const tokens2 = tokenizer.tokenize('/*comment*/ foo --test');
    expect(tokens2[0].comments).to.be.deep.equal(['comment', 'test']);

    const tokens3 = tokenizer.tokenize('--comment\nfoo --test');
    expect(tokens3[0].comments).to.be.deep.equal(['comment', 'test']);

    const tokens4 = tokenizer.tokenize('foo --comment');
    expect(tokens4[0].comments).to.be.deep.equal(['comment']);

    const tokens5 = tokenizer.tokenize('foo');
    expect(tokens5[0].comments).to.be.deep.equal([]);

    const tokens6 = tokenizer.tokenize('foo /*comment 1*/ /*comment 2*/');
    expect(tokens6[0].comments).to.be.deep.equal(['comment 1', 'comment 2']);

    const tokens7 = tokenizer.tokenize('foo\n-- comment');
    expect(tokens7[0].comments).to.be.deep.equal([' comment']);

    const tokens8 = tokenizer.tokenize('1 /*/2 */');
    expect(tokens8[0].comments).to.be.deep.equal(['/2 ']);
  });
});
