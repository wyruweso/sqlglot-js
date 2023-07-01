import {Expression} from "./expression";

export class Star extends Expression {

  constructor() {
    super({"except": false, "replace": false});
  }

  getOutputName() {
    return '*';
  }

}
