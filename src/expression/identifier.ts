import {Expression} from "./expression";

export class Identifier extends Expression {

  isQuoted(): boolean {
    return Boolean(this.getArgument('quoted'));
  }

}
