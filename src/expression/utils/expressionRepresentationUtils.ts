import {Expression} from "../expression";
import {Var} from "../var";
import {Identifier} from "../identifier";
import {Literal} from "../literal";
import {Star} from "../star";
import {Null} from "../null";
import {Dot} from "../dot";
import {Cast} from "../cast";
import {From} from "../from";
import {TableAlias} from "../tableAlias";
import {Join} from "../join";

export class ExpressionRepresentationUtils {

  static getName(expression: Expression): string {
    if (expression instanceof Star) {
      return '*';
    }
    if (expression instanceof Null) {
      return 'Null';
    }
    if (expression instanceof Dot) {
      return ExpressionRepresentationUtils.getName(expression.getExpressionArgument());
    }
    if (expression instanceof Cast || expression instanceof From) {
      return ExpressionRepresentationUtils.getName(expression.getThisArgument());
    }
    return ExpressionRepresentationUtils.getText(expression, 'this');
  }

  /**
   * Returns a textual representation of the argument corresponding to "key". This can only be used
   * for args that are strings or leaf Expression instances, such as identifiers and literals.
   * */
  static getText(expression: Expression, key: string): string {
    const field = expression.getArgument(key);
    if (typeof field === 'string') {
      return field;
    }

    if (
      field instanceof Identifier
      || field instanceof Literal
      || field instanceof Var
    ) {
      return field.getThisArgument();
    }
    if (field instanceof Star || field instanceof Null) {
      return ExpressionRepresentationUtils.getName(expression);
    }

    return "";
  }

  static getAlias(expression: Expression): string {
    const aliasArg = expression.getArgument('alias');
    if (aliasArg instanceof TableAlias) {
      return ExpressionRepresentationUtils.getName(aliasArg);
    }
    return ExpressionRepresentationUtils.getText(expression, 'alias');
  }

  static getAliasOrName(expression: Expression): string {
    if (expression instanceof From || expression instanceof Join) {
      return ExpressionRepresentationUtils.getAliasOrName(expression.getThisArgument());
    }
    return ExpressionRepresentationUtils.getName(expression) || ExpressionRepresentationUtils.getAlias(expression);
  }

}
