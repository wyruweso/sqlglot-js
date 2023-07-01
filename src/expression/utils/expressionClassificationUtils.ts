import {Expression} from "../expression";
import {Literal} from "../literal";
import {ExpressionRepresentationUtils} from "./expressionRepresentationUtils";
import {Star} from "../star";
import {Subquery} from "../subquery";
import {Union} from "../union";
import {Select} from "../select";

export class ExpressionClassificationUtils {

  static isString(expression: Expression): boolean {
    return expression instanceof Literal && expression.getArgument('isString');
  }

  static isNumber(expression: Expression): boolean {
    return expression instanceof Literal && !expression.getArgument('isString');
  }

  static isInt(expression: Expression): boolean {
    if (!ExpressionClassificationUtils.isNumber(expression)) {
      return false;
    }
    const nameAsNumber = Number(ExpressionRepresentationUtils.getName(expression));
    return Number.isInteger(nameAsNumber);
  }

  static isStar(expression: Expression): boolean {
    if (expression instanceof Subquery) {
      return ExpressionClassificationUtils.isStar(expression.getThisArgument());
    }
    if (expression instanceof Union) {
      return ExpressionClassificationUtils.isStar(expression.getThisArgument())
        || ExpressionClassificationUtils.isStar(expression.getExpressionArgument())
    }
    if (expression instanceof Select) {
      const expressions = expression.getExpressionsArgument();
      return expressions.some(expr => ExpressionClassificationUtils.isStar(expr));
    }
    return expression instanceof Star;
  }

}
