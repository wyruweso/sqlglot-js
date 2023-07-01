import {Expression} from "../expression";
import {Var} from "../var";
import {Identifier} from "../identifier";
import {Literal} from "../literal";
import {Star} from "../star";
import {Null} from "../null";

export class ExpressionRepresentationUtils {

  /**
   * Returns a textual representation of the argument corresponding to "key". This can only be used
   * for args that are strings or leaf Expression instances, such as identifiers and literals.
   * */
  asText(expression: Expression, key: string): string {
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
      return field.getName();
    }

    return "";
  }

}
