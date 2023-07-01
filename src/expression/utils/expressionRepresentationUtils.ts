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
import {Column} from "../column";
import {Paren} from "../paren";
import {Subquery} from "../subquery";
import {Alias} from "../alias";

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

  /**
   * Name of the output column if this expression is a selection.
   *
   *         If the Expression has no output name, an empty string is returned.
   *
   *         Example:
   *             >>> from sqlglot import parse_one
   *             >>> parse_one("SELECT a").expressions[0].output_name
   *             'a'
   *             >>> parse_one("SELECT b AS c").expressions[0].output_name
   *             'c'
   *             >>> parse_one("SELECT 1 + 2").expressions[0].output_name
   *             ''
   * */
  static getOutputName(expression: Expression): string {
    if (
      [Column, Literal, Dot, Cast, Identifier, Star].some(cl => expression instanceof cl)
    ) {
      return ExpressionRepresentationUtils.getName(expression);
    }

    if (expression instanceof Paren) {
      return ExpressionRepresentationUtils.getName(expression.getThisArgument());
    }
    if (expression instanceof Subquery || expression instanceof Alias) {
      return ExpressionRepresentationUtils.getAlias(expression);
    }

    return "";
  }

}
