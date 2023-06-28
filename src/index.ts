import {Tokenizer} from './tokenizer/tokenizer';
import {defaultTokenizerGrammar} from './tokenizer/config/dialect/defaultTokenizerGrammar';

const tokenizer = new Tokenizer(defaultTokenizerGrammar);

const tokens = tokenizer.tokenize('SELECT * FROM users;');
console.log(tokens);
