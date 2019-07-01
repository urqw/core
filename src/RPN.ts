import Game from "./Game";

export default class Expression {

  protected expr : string[] = [];
  protected Game : Game;

  constructor (Game : Game) {
    this.Game = Game;
  }

    /**
     * токенолизатор
     */
  protected static tokenize(str : string) : string[] {
      str = " " + str + " ";
      str = str.replace(/ not /g, "  not  "); // пока так (чтобы not мог прилипать ко всему)

      return str.split(
          /(".+?"|'.+?'| AND | OR | NOT |\|\||&&|<>|!=|==|<=|>=|\+|-|\*|\/|>|<|=|\(|\))/gi
      );
  }

  protected toRPN() : any[] {
      let exitStack: any[] = [];
      let operStack: any[] = [];
      let lastTokenIsOperator = true;

      for (let i = 0; i < this.expr.length; i++) {
          let token = this.expr[i].trim();

          if (token.length === 0) continue;

          // если отрицательное число
          if (lastTokenIsOperator && token === "-") {
              do {
                  token = this.expr[++i].trim();
              } while (token.length === 0);

              exitStack.push([
                  -parseFloat(token.replace(",", ".").replace(/ /g, ""))
              ]);
              // если число
          } else if (!isNaN(token.replace(",", ".").replace(/ /g, "") as any)) {
              // считываем всё число дальше
              exitStack.push([parseFloat(token.replace(",", ".").replace(/ /g, ""))]);
          } else if (Expression.getPriority(token) > 0) {
              if (token === "(") {
                  operStack.push(token);
              } else if (token === ")") {
                  while (operStack[operStack.length - 1] !== "(") {
                      exitStack.push(operStack.pop());
                  }

                  operStack.pop();
              } else {
                  while (
                      Expression.getPriority(token) <=
                      Expression.getPriority(operStack[operStack.length - 1])
                      ) {
                      if (operStack.length === 0) break;
                      exitStack.push(operStack.pop());
                  }

                  operStack.push(token);
              }
          } else {
              let variable = this.Game.getVar(token);

              if (variable === 0) {
                  if (token.substr(0, 1) === "'" || token.substr(0, 1) === '"') {
                      if (token.substr(-1, 1) === "'" || token.substr(-1, 1) === '"') {
                          variable = token.substr(1, token.length - 2);
                      }
                  }
              }

              exitStack.push([variable]);
          }

          lastTokenIsOperator = Expression.getPriority(token) > 1;
      }

      while (operStack.length > 0) {
          exitStack.push(operStack.pop());
      }

      return exitStack;
  }

  public setExpression(str : string) : Expression {
    this.expr = Expression.tokenize(str);

    return this;
  }

  public calc() : number | boolean | string {
    let stack: string[] = this.toRPN();
    let temp : any[] = [];

    for (let i = 0; i < stack.length; i++) {
      let token = stack[i];

      if (Expression.getPriority(token) > 0) {
        let result;

        if (/*token == '!' ||*/ token === "not") {
          let variable = temp.pop();

          result = !(variable == true || variable > 0);
        } else {
          let a = temp.pop();
          let b = temp.pop();

          switch (token) {
            case "*":
              result = b * a;
              break;
            case "/":
              result = b / a;
              break;
            case "+":
              result = b + a;
              break;
            case "-":
              result = b - a;
              break;
            case "==":
              if (typeof b == "string" && typeof a == "string") {
                let reg = new RegExp(
                    "^" +
                    a
                        .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
                        .replace(/\\\*/g, ".*")
                        .replace(/\\\?/g, ".") +
                    "$",
                    "i"
                );
                result = b.search(reg) != -1;
              } else {
                result = b == a;
              }
              break;
            case "=":
              if (typeof b == "string" && typeof a == "string") {
                result = b.toLowerCase() == a.toLowerCase();
              } else {
                result = b == a;
              }
              break;
            case "!=":
            case "<>":
              if (typeof b == "string" && typeof a == "string") {
                result = b.toLowerCase() != a.toLowerCase();
              } else {
                result = b != a;
              }

              break;
            case ">":
              result = b > a;
              break;
            case "<":
              result = b < a;
              break;
            case ">=":
              result = b >= a;
              break;
            case "<=":
              result = b <= a;
              break;
            case "&&":
            case "and":
              result = (b == true || b > 0) && (a == true || a > 0);
              break;
            case "||":
            case "or":
              result = b == true || b > 0 || (a == true || a > 0);
              break;
          }
        }

        temp.push(result);
      } else {
        temp.push(token[0]);
      }
    }

    return temp.pop();
  }

  protected static getPriority(operand : string) : number {
    switch (operand) {
      case "not":
        return 15;
      case "*":
      case "/":
        return 14;
      case "+":
      case "-":
        return 13;
      case "<":
      case "<=":
      case ">":
      case ">=":
        return 11;
      case "=":
      case "==":
      case "!=":
      case "<>":
        return 10;
      case "&&":
      case "and":
        return 6;
      case "||":
      case "or":
        return 5;
      case "(":
      case ")":
        return 1;
      default:
        return 0;
    }
  }
}