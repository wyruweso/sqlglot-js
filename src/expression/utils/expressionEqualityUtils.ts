import {Expression} from "../expression";
import {Literal} from "../literal";
import {Identifier} from "../identifier";
import hash from 'object-hash';

export class ExpressionEqualityUtils {

  static _normalizeArg(arg: any): any {
    if (typeof arg === 'string') {
      return arg.toLowerCase();
    }
    return arg;
  }

  static getHashableArgs(expression: Expression): any[] {
    if (expression instanceof Literal) {
      return [expression.getThisArgument(), expression.getArgument('isString')]
    }

    if (expression instanceof Identifier) {
      const thisArg = expression.getThisArgument() as string;
      const loweredThisArg = thisArg.toLowerCase();
      if (expression.isQuoted() && thisArg !== loweredThisArg) {
        return [thisArg, expression.isQuoted()];
      }
      return [loweredThisArg];
    }


    const args = Object.keys(expression.getArgTypes())
      .map(key => expression.getArgument(key));

    const hashableArgs: any[] = [];
    for (const arg of args) {
      if (arg && Array.isArray(arg)) {
        const normalizedSubArgs: any[] = arg.map(subArg => ExpressionEqualityUtils._normalizeArg(subArg));
        hashableArgs.push(normalizedSubArgs);
      } else if (arg) {
        const normalized = ExpressionEqualityUtils._normalizeArg(arg);
        hashableArgs.push(normalized);
      } else {
        hashableArgs.push(null);
      }
    }
    return hashableArgs;
  }

  static getHash(expression: Expression): string {
    const hashableArgs = ExpressionEqualityUtils.getHashableArgs(expression);
    return hash.sha1(hashableArgs);
  }

  static areEqual(expression1: any, expression2: any): boolean {
    if (!(expression1 instanceof Expression && expression2 instanceof Expression)) {
      return false;
    }

    return ExpressionEqualityUtils.getHash(expression1) === ExpressionEqualityUtils.getHash(expression2);
  }

}
