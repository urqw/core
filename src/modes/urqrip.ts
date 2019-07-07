import Player, {gotoType} from "../core/Player";

function set() {
  /**
   * следующая строка
   */
  Player.prototype.next = function() : string | null {
    let line = this.game.quest.get(this.game.position);

    this.game.position++;

    if (line === null) {
      return null;
    }

    // вырезать комментарий
    if (line.includes(";")) {
      line = line.substring(0, line.indexOf(";"));
    }

    return line.replace(/\t/g, " ");
  };

  /**
   * коммон
   */
  Player.prototype.common = function() {
    if (this.proc("common")) {
      this.forgetProcs();
      this.play();
    }
  };

  /**
   * прыгнуть на метку
   */
  Player.prototype.goto = function(labelName: string, type: gotoType) : boolean {
    let labelPosition: number | null = this.game.quest.getLabelPosition(labelName);

    if (labelPosition === null) {
      return false;
    }

    // todo контанты
    if (type === gotoType.BTN || type === gotoType.GOTO) {
      this.game.setVar("previous_loc", this.game.getVar("current_loc"));
      this.game.setVar("current_loc", labelName);
    }

    if (type === gotoType.GOTO) {
      //                this.buttons = [];
      //                this.text = [];
    }

    if (type === gotoType.BTN || type === gotoType.GOTO || type === gotoType.PROC) {
      let labelCounter : number = +this.game.getVar(labelName);

      this.game.setVar(labelName, labelCounter + 1);
    }

    this.game.position = labelPosition;

    // весь стек что дальше очищается
    this.flowStack[this.flow] = [];

    return true;
  };

  return Player;
}

export default set;
