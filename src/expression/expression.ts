/**
 * ## Expressions
 *
 * Every AST node in SQLGlot is represented by a subclass of `Expression`.
 *
 *   This module contains the implementation of all supported `Expression` types. Additionally,
 *   it exposes a number of helper functions, which are mainly used to programmatically build
 * SQL expressions, such as `sqlglot.expressions.select`.
 *
 * ----
 * */


export class Expression {
  /**
   *  a unique key for each class in the Expression hierarchy. This is useful for hashing
   *  and representing expressions as strings.
   * */
  _key: string;

  /**
   * determines what arguments (child nodes) are supported by an expression. It
   * maps arg keys to booleans that indicate whether the corresponding args are required.
   * */
  _argTypes: Record<string, boolean>;

  /**
   * a reference to the parent expression (or null, in case of root expressions).
   * */
  _parent: Expression | null;

  /**
   * the arg key an expression is associated with, i.e. the name its parent expression uses to refer to it.
   * */
  _argKey: string | null;

  /**
   * a list of comments that are associated with a given expression. This is used in
   * order to preserve comments when transpiling SQL code.
   * */
  _comments: Array<string>;

  /**
   * the type of expression. This is inferred by the optimizer, in order to enable some
   * transformations that require type information.
   * */
  _type: ExpressionDataType | null;

  /**
   * a mapping used for retrieving the arguments of an expression, given their arg keys.
   * */
  _args: Record<string, any>

  _meta: Record<string, any> | null;

  _hash: number | null;

  constructor(
    argTypes: Record<string, boolean> = {"this": true},
    args: Record<string, any> = {},
  ) {
    this._key = this.constructor.name.toLowerCase();
    this._argTypes = argTypes;
    this._args = args;

    this._parent = null;
    this._argKey = null;
    this._comments = [];
    this._type = null;
    this._meta = null;
    this._hash = null;

    for (const argKey of Object.keys(args)) {
      const value = args[argKey];
      this._setParent(argKey, value);
    }
  }

  _setParent(argKey: string, value: any) {
    const configParent = (element: Record<string, any>) => {
      if (element.hasOwnProperty('parent')) {
        element.parent = this;
        element.argKey = argKey;
      }
    }

    if (Array.isArray(value)) {
      for (const e of value) {
        configParent(e);
      }
    } else {
      configParent(value);
    }
  }

  getArgument(key: string): any | null | undefined {
    return this._args[key];
  }

  getThisArgument(): any | null | undefined {
    return this.getArgument('this');
  }

  getExpressionArgument(): any | null | undefined {
    return this.getArgument('expression');
  }

  getExpressionsArgument(): any[] {
    return this.getArgument('expressions') || [];
  }


}


export class ExpressionDataType extends Expression {

  constructor(
    argTypes: Record<string, boolean> = {"this": true},
    args: Record<string, any> = {},
  ) {
    super(argTypes, args);
  }

  static build(): ExpressionDataType {
    return new ExpressionDataType({
      "this": true,
      "expressions": false,
      "nested": false,
      "values": false,
      "prefix": false,
    });
  }

  isType(): boolean {
    return true;
  }

}
