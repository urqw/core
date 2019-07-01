import Player, {gotoType} from "../Player";

function set() {
  /**
   * следующая строка
   */
  Player.prototype.next = function() : string | null {
    let line = this.Game.Quest.get(this.Game.position);

    this.Game.position++;

    if (line === null) {
      return null;
    }

    // вырезать комментарий
    if (line.indexOf(";") !== -1) {
      line = line.substring(0, line.indexOf(";"));
    }

    return line.replace(/\t/g, " ");
  };

  /**
   * прыгнуть на метку
   */
  Player.prototype.goto = function(labelName: string, type: gotoType): boolean {
    let labelPosition: number | null = this.Game.Quest.getLabelPosition(labelName);

    if (labelPosition === null) {
      return false;
    }

    // todo контанты
    if (type === gotoType.BTN) {
      this.Game.setVar("previous_loc", this.Game.getVar("current_loc"));
      this.Game.setVar("current_loc", labelName);
    }

    if (type === gotoType.BTN || type === gotoType.GOTO || type === gotoType.PROC) {
      let labelCounter : number = +this.Game.getVar("count_" + labelName);

      this.Game.setVar("count_" + labelName, labelCounter + 1);
    }

    this.Game.position = labelPosition;

    // весь стек что дальше очищается
    this.flowStack[this.flow] = [];

    return true;
  };

  return Player;
}

export default set;
