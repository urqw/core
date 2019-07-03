import Expression from "./Expression";
import Game from "./Game";
import Player, {gotoType} from "./Player";
import { isFloat } from "./tools";

export default class Parser {
  player : Player;
  expression : Expression;

  constructor(Player : Player, Game : Game) {
    /**
     * проигрыватель
     */
    this.player = Player;

    this.expression = new Expression(Game);
  }

  parse(line : string) {
    line = line.replace(/^\s+/, "");
    // просмотреть список известных операторов
    let expl = line.split(" ");
    let operand = expl[0].toLowerCase().trim();
    let command = expl.slice(1).join(" ");

    if (operand === "if") {
      let cond = line.substring(
        line.indexOf("if ") + 3,
        line.indexOf(" then ")
      );

      let then;
      let els : string | null;
      let ifline = line;

      // todo переделать на обратную польскую
      if (ifline.indexOf(" if ") !== -1) {
        ifline = ifline.substring(0, ifline.indexOf(" if ") + 1);
      }

      if (ifline.indexOf(" else ") === -1) {
        then = line.substring(line.indexOf(" then ") + 6);
        els = null;
      } else {
        then = line.substring(
          line.indexOf(" then ") + 6,
          line.indexOf(" else ")
        );
        els = line.substring(line.indexOf(" else ") + 6);
      }

      let conditionResult = this.expression.setExpression(this.openTags(cond)).calc();

      if (conditionResult === true || conditionResult > 0) {
        this.parse(then);
      } else if (els !== null) {
          this.parse(els);
      }

      return;
    } else if (operand === "btn") {
      let xbtn = command.split(",");

      if (xbtn.length > 1) {
        let desc = this.prepareLine(
          xbtn
            .slice(1)
            .join(",")
            .trim()
        );
        let com = xbtn[0].trim();

        if (com.indexOf("&") === -1) {
          com = this.openTags(com);
        }

        return this.player.btn(com, desc);
      }
    }

    //todo
    line = this.prepareLine(line);
    expl = line.split(" ");
    operand = expl[0].toLowerCase().trim();
    command = expl.slice(1).join(" ");

    if (operand[0] === ":") return;

    switch (operand) {
      case "save":
        return this.player.save();
      case "image":
        return this.player.image(command.toString().trim());
      case "music":
        return this.player.playMusic(command.toString().trim(), false);
      case "play":
        let Sound;
        if (this.player.game.resources === null) {
          Sound = new Audio(
            "quests/" + this.player.game.name + "/" + command.toString().trim()
          );
        } else {
          Sound = new Audio(this.player.game.resources[command.toString().trim()]);
        }

        Sound.volume = this.player.client.getVolume();
        Sound.play();

        break;
      case "clsb":
        return this.player.clsb();
      case "cls":
        return this.player.cls();
      case "forget_procs":
        return this.player.forgetProcs();
      case "proc":
        return this.player.proc(command.toString().trim());
      case "end":
        return this.player.end();
      case "anykey":
        return this.player.anykey(command.toString().trim());
      case "pause":
        return this.player.pause(parseInt(command));
      case "input":
        return this.player.input(command.toString().trim());
      case "quit":
        return this.player.quit();
      case "invkill":
        return this.player.invkill(
          command.toString().trim().length > 0
            ? command.toString().trim()
            : null
        );
      case "perkill":
        return this.player.perkill();
      case "inv-":
        let itemRemove : string;
        let quantityRemove : number;
        if (command.split(",").length > 1) {
          quantityRemove = parseInt(command.split(",")[0]);
          itemRemove = command.split(",")[1];
        } else {
          quantityRemove = 1;
          itemRemove = command.split(",")[0];
        }

        return this.player.invRemove(itemRemove.trim(), quantityRemove);
      case "inv+":
        let itemAdd : string;
        let quantityAdd : number;
        if (command.split(",").length > 1) {
            quantityAdd = parseInt(command.split(",")[0]);
            itemAdd = command.split(",")[1];
        } else {
            quantityAdd = 1;
            itemAdd = command.split(",")[0];
        }

        return this.player.invAdd(itemAdd.trim(), quantityAdd);
      case "goto":
        return this.player.goto(command.toString().trim(), gotoType.GOTO);
      case "p":
      case "print":
        return this.player.print(this.openLinks(command), false);
      case "pln":
      case "println":
        return this.player.print(this.openLinks(command), true);
      case "btn":
        let btn = command.split(",");

        return this.player.btn(
          btn[0].trim(),
          btn
            .slice(1)
            .join(",")
            .trim()
        );
      //рудименты далее
      case "tokens":
        let reg;

        if (this.player.game.getVar("tokens_delim") === "char") {
          reg = "";
        } else {
          reg = new RegExp(
            "[" +
              String(this.player.game.getVar("tokens_delim")).replace(
                /[-[\]{}()*+?.,\\^$|#\s]/g,
                "\\$&"
              ) +
              "]",
            "gi"
          );
        }

        let str : string[] = String((this.expression.setExpression(command.trim())).calc()).split(reg);

        this.player.setVar("tokens_num", str.length);

        for (let i = 0; i < str.length; i++) {
          this.player.setVar("token" + (i + 1), str[i]);
        }

        break;
      case "instr":
        line = command;

        if (line.indexOf("=") > 0) {
          this.player.setVar(
            line.substring(0, line.indexOf("=")).trim(),
              String(this.expression.setExpression("'" + line.substr(line.indexOf("=") + 1) + "'").calc())
          );
        }

        // no break here
        break;

      // если ничего не помогло^w^w^w не оператор
      default:
        //  это выражение?
          if (line.indexOf("=") > 0) {
              this.player.setVar(
                  line.substring(0, line.indexOf("=")).trim(),
                  String(this.expression.setExpression(line.substr(line.indexOf("=") + 1)).calc())
              );
        } else {
          console.log("Unknown operand: " + operand + " ignored (line: " + line + ")");
        }
    }
  }

  /**
   * Разбиваем по &
   */
  prepareLine(line : string) : string {
    let pos = line
      .replace(/\[\[.+?\]\]/g, function(exp) {
        return exp.replace(/&/g, " ");
      })
      .indexOf("&");

    if (pos !== -1) {
      this.player.flowAdd(line.substring(pos + 1));
      line = line.substring(0, pos).replace(/^\s+/, "");
    }

    return this.openTags(line);
  }

  /**
   * Открываем #$, #%$
   */
  openTags(line : string) : string {
    line = line.replace(/#\$/g, " ");
    line = line.replace(/#%\$/g, " ");

    // ##$
    line = line.replace(/##[^#]+?\$/g, function(exp : string) : string {
      return "&#" + exp.substr(2, exp.length - 3) + ";";
    });

    while (line.search(/#[^#]+?\$/) !== -1) {
      line = line.replace(/#[^#]+?\$/, (exp : string) : string => {
        // рудимент для совместимости
        if (exp[1] === "%") {
          exp = exp.substr(2, exp.length - 3);
        } else {
          exp = exp.substr(1, exp.length - 2);
        }
        let result = this.expression.setExpression(exp).calc();

        return String(isFloat(result) ? Number(result).toFixed(2) : result);
      });
    }

    return line;
  }

  openLinks(line : string) : string {
    while (line.search(/\[\[.+?\]\]/) !== -1) {
      line = line.replace(/\[\[.+?\]\]/, exp => {
        let text;
        let command;
        exp = exp.substr(2, exp.length - 4);

        if (exp.indexOf("|") > 0) {
          let exptmp = exp.split("|");
          command = exptmp
            .slice(1)
            .join("|")
            .trim();
          text = exptmp[0].trim();
        } else {
          command = exp.trim();
          text = exp;
        }

        return this.player.link(text, command);
      });
    }

    return line;
  }
}
