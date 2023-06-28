import 'mocha';
import {expect} from 'chai';
import {defaultTokenizerGrammar} from '../../src/tokenizer/config/dialect/defaultTokenizerGrammar';
import {Tokenizer} from '../../src/tokenizer/tokenizer';
import {TokenType} from '../../src/tokenizer/enums/tokenType';

const tokenizer = new Tokenizer(defaultTokenizerGrammar);
describe('Test tokenizing comments', () => {
  it('should attach multiline comments to tokens', () => {
    const singleComment = tokenizer.tokenize('/*comment*/ foo');
    expect(singleComment[0].comments).to.be.deep.equal(['comment']);

    const multipleComments = tokenizer.tokenize(
      'foo /*comment 1*/ /*comment 2*/'
    );
    expect(multipleComments[0].comments).to.be.deep.equal([
      'comment 1',
      'comment 2',
    ]);

    const multiLineWithSlash = tokenizer.tokenize('1 /*/2 */');
    expect(multiLineWithSlash[0].comments).to.be.deep.equal(['/2 ']);
  });

  it('should attach singleline comments to tokens', () => {
    const singleComment = tokenizer.tokenize('foo --comment');
    expect(singleComment[0].comments).to.be.deep.equal(['comment']);

    const multipleComments = tokenizer.tokenize('--comment\nfoo --test');
    expect(multipleComments[0].comments).to.be.deep.equal(['comment', 'test']);
  });

  it('should attach mixed comments to tokens', () => {
    const mixedComments = tokenizer.tokenize('/*comment*/ foo --test');
    expect(mixedComments[0].comments).to.be.deep.equal(['comment', 'test']);
  });

  it('should handle when there are no comments', () => {
    const noComments = tokenizer.tokenize('foo');
    expect(noComments[0].comments).to.be.deep.equal([]);
  });
});

describe('Test getting correct line and column during tokenizing', () => {
  it('should correctly detect line and column of multiline statement', () => {
    const multiline = tokenizer.tokenize(`SELECT /*
line break
*/
'x
 y',
x`);
    expect(multiline[0].line).to.be.equal(1);
    expect(multiline[0].col).to.be.equal(6);
    expect(multiline[1].line).to.be.equal(5);
    expect(multiline[1].col).to.be.equal(3);
    expect(multiline[2].line).to.be.equal(5);
    expect(multiline[2].col).to.be.equal(4);
    expect(multiline[3].line).to.be.equal(6);
    expect(multiline[3].col).to.be.equal(1);
  });

  it('should correctly detect line and column in tokens in singleline statement', () => {
    const singleline = tokenizer.tokenize('SELECT .');
    expect(singleline[1].line).to.be.equal(1);
    expect(singleline[1].col).to.be.equal(8);
  });

  it('should correctly detect start and end position of tokens', () => {
    const positions1 = tokenizer.tokenize("'''abc'");
    expect(positions1[0].start).to.be.equal(0);
    expect(positions1[0].end).to.be.equal(6);

    const positions2 = tokenizer.tokenize("'abc'");
    expect(positions2[0].start).to.be.equal(0);
  });
});

describe('Test tokenizing commands', () => {
  it('should correctly tokenize commands', () => {
    const showCommand = tokenizer.tokenize('SHOW;');
    expect(showCommand[0].token_type).to.be.equal(TokenType.SHOW);
    expect(showCommand[1].token_type).to.be.equal(TokenType.SEMICOLON);

    const executeCommand = tokenizer.tokenize('EXECUTE');
    expect(executeCommand[0].token_type).to.be.equal(TokenType.EXECUTE);
    expect(executeCommand.length).to.be.equal(1);

    const fetchShowCommands = tokenizer.tokenize('FETCH;SHOW;');
    expect(fetchShowCommands[0].token_type).to.be.equal(TokenType.FETCH);
    expect(fetchShowCommands[1].token_type).to.be.equal(TokenType.SEMICOLON);
    expect(fetchShowCommands[2].token_type).to.be.equal(TokenType.SHOW);
    expect(fetchShowCommands[3].token_type).to.be.equal(TokenType.SEMICOLON);
  });
});

describe('Test error message', () => {
  it('should throw error when there is no matching token', () => {
    expect(() => {
      tokenizer.tokenize('select /*');
    }).to.throw(
      "Error tokenizing 'select /'\n\nOriginal error: string index out of range"
    );
  });
});
