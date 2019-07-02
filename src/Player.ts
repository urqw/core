import Parser from "./Parser";
import Client from "./Client";
import {dosColorToHex} from "./tools";
import Game, {itemInterface, varInterface} from "./Game";
import ModeUrqRip from "./modes/urqrip";
import ModeUrqDos from "./modes/urqdos";

export enum modes {
    RIPURQ = 'ripurq',
    DOSURQ = 'dosurq',
    URQW = 'urqw',
}

export interface savedGameInterface {
    status: status,
    text: contentInterface[],
    buttons: buttonInterface[],
    items: itemInterface,
    vars: varInterface,
    position: number,
}

export enum gotoType {
    BTN,
    GOTO,
    PROC,
}

export enum status {
    NEXT,
    END,
    ANYKEY,
    PAUSE,
    INPUT,
    QUIT,
}

export interface contentInterface {
    img?: string,
    text?: string,
    ln?: boolean,
    color?: string
}

export interface buttonInterface {
    id: number,
    command: string,
    desc: string,
}

export interface linkInterface {
    [key: number]: string
}

export default class Player {
    get text(): contentInterface[] {
        return this._text;
    }

    get buttons(): buttonInterface[] {
        return this._buttons;
    }

    public Client: Client;
    public Game: Game;
    protected Parser: Parser;

    private _text: contentInterface[] = [];
    private _buttons: buttonInterface[] = [];
    protected links: linkInterface = {};

    protected status: status = status.NEXT;
    protected inf: string = '';
    protected timer: number = 0; //todo

    protected procPosition: number[] = [];

    public flow: number = 0;
    public flowStack: { [key: number]: string[] } = {};

    constructor(Game: Game, Client: Client) {
        this.flowStack[this.flow] = [];

        this.Game = Game;
        this.restart();
        this.Client = Client;
        this.Parser = new Parser(this, this.Game);
    }

    /**
     * перезапуск
     */
    public restart(): void {
        this.Game.clean();

        this.Game.setVar("current_loc", this.Game.Quest.firstLabel);
        this.Game.setVar("previous_loc", this.Game.Quest.firstLabel);
    }

    public continue(): void {
        this.play();

        this.fin();
    }

    /**
     * рендер
     */
    protected fin(): void {
        if (this.Game.getVar("music")) {
            this.playMusic(String(this.Game.getVar("music")), true);
        }

        if (this.status !== status.NEXT) {
            this.Client.render();
        }

        this.Game.setLocked(!(
            this.status === status.END ||
            this.status === status.PAUSE
        ));
    }

    public play(line: string | null = null): void {
        this.Game.setLocked();

        this.status = status.NEXT;

        if (line !== null) {
            this.Parser.parse(line);
        }

        while (this.status === status.NEXT) {
            if (
                this.flowStack[this.flow].length === 0 &&
                (line = this.next()) !== null
            ) {
                this.Parser.parse(line);
            }

            while (this.flowStack[this.flow].length > 0 && this.status === status.NEXT) {
                this.Parser.parse(this.flowStack[this.flow].pop()!); // todo !
            }
        }
    }

    /**
     * следующая строка
     */
    public next(): string | null {
        let line = this.Game.Quest.get(this.Game.position);

        this.Game.position++;

        if (line === null) {
            return null;
        }

        return line.replace(/\t/g, " ");
    }

    /**
     * добавление команды в текущий поток
     */
    public flowAdd(line: string): void {
        this.flowStack[this.flow].push(line);
    }

    /**
     * команды далее исполняются юзером по ходу игры
     */

    public common(): void {
        let commonLabel = "common";

        if (this.Game.getVar("common") !== 0) {
            commonLabel = commonLabel + "_" + this.Game.getVar("common");
        }

        if (this.proc(commonLabel)) {
            this.forgetProcs();
            this.play();
        }
    }

    public action(actionId: number, link: boolean = false): void {
        let label: string | null = null;
        if (link) {
            label = this.links[actionId];
            delete this.links[actionId];
        } else {
            for (let key in this._buttons) {
                if (this._buttons[key].id === actionId) {
                    label = this._buttons[key].command;
                    delete this._buttons[key];

                    break;
                }
            }
        }

        if (label === null) {
            return;
        }

        let labelPosition: number | null = this.Game.Quest.getLabelPosition(label);

        if (labelPosition === null) {
            this.xbtnAction(label);
        } else {
            this.btnAction(label);
        }
    }

    protected btnAction(labelName: string): void {
        this.cls();

        this.common();

        if (this.goto(labelName, gotoType.BTN)) {
            this.continue();
        }
    }

    protected xbtnAction(command: string): void {
        this.common();

        this.play(command + "&end");
        this.fin();
    }

    protected useAction(labelName: string): void {
        this.play("proc " + labelName + "&end");
        this.fin();
    }

    public anykeyAction(keycode: string): void {
        if (this.inf.length > 0) {
            this.Game.setVar(this.inf, keycode);
        }

        this.continue();
    }

    public inputAction(value: string): void {
        this.Game.setVar(this.inf, value);

        this.continue();
    }

    public setVar(variable: string, value: string | number): void {
        variable = variable.trim();

        if (variable.toLowerCase() === "style_dos_textcolor") {
            this.Game.setVar("style_textcolor", dosColorToHex(+value)); // todo +
        } else if (variable.toLowerCase() === "image") {
            let file : string = String(value);
            if (this.Game.resources != null) {
                if (this.Game.resources[file] !== undefined) {
                } else if (this.Game.resources[file + ".png"] !== undefined) {
                    file = file + ".png";
                } else if (this.Game.resources[file + ".jpg"] !== undefined) {
                    file = file + ".jpg";
                } else if (this.Game.resources[file + ".gif"] !== undefined) {
                    file = file + ".gif";
                }
            }

            this.image(file);
        }

        this.Game.setVar(variable, value);
    }

    public image(src: string): void {
        if (src && this.Game.resources[src]) {
            this._text.push({
                img: this.Game.resources[src]
            });
        }
    }

    public playMusic(src: string, loop: boolean): void {
        let file : string;

        if (this.Game.resources === null) {
            file = "quests/" + this.Game.name + "/" + src;
        } else {
            file = this.Game.resources[src];
        }

        if (src) {
            if (Client.gameMusic.getAttribute("src") !== file) {
                Client.gameMusic.src = file;

                if (loop) {
                    Client.gameMusic.addEventListener(
                        "ended",
                        function () {
                            Client.gameMusic.src = file;
                            Client.gameMusic.play();
                        },
                        false
                    );
                }

                Client.gameMusic.play();
            }
        } else {
            Client.gameMusic.pause();
        }
    }

    /**
     * прыгнуть на метку
     */
    public goto(labelName: string, type: gotoType): boolean {
        let labelPosition: number | null = this.Game.Quest.getLabelPosition(labelName);

        if (labelPosition === null) {
            return false;
        }

        if (type === gotoType.BTN || type === gotoType.GOTO) {
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
    }

    /**
     * удаление переменных
     */
    public perkill(): void {
        this.Game.vars = {};

        for (let key in this.Game.items) {
            this.Game.setVar(key, this.Game.items[key]);
        }
    }

    public cls(): void {
        this._text = [];
        this._buttons = [];
        this.links = {};

        this.Client.render();
    }

    public clsb(): void {
        this._buttons = [];
        this.links = {};

        this._text = Client.removeLinks(this._text);

        this.Client.render();
    }

    public invkill(item : string | null = null): void {
        if (item === null) {
            for (let key in this.Game.items) {
                this.Game.setItem(key, 0);
            }
        } else {
            this.Game.setItem(item, 0);
        }
    }

    /**
     * прок
     */
    public proc(label: string): boolean {
        this.flow++;
        this.procPosition.push(this.Game.position);

        if (this.goto(label, gotoType.PROC)) {
            this.flowStack[this.flow] = [];

            return true;
        } else {
            this.flow--;
            this.procPosition.pop();

            return false;
        }
    }

    public end(): void {
        if (this.procPosition.length > 0) {
            this.flowStack[this.flow].pop();
            this.Game.position = this.procPosition.pop()!; // todo !
            this.flow--;
        } else {
            this.flowStack[this.flow] = [];
            this.status = status.END;
        }
    }

    public forgetProcs(): void {
        this.flowStack[0] = this.flowStack[this.flow];
        this.procPosition = [];
        this.flow = 0;
    }

    public anykey(inf: string): void {
        this.inf = inf;
        this.status = status.ANYKEY;
    }

    public pause(milliseconds: number): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
        }
        this.status = status.PAUSE;

        // todo window.setTimeout
        this.timer = window.setTimeout(() => {
            if (this.status === status.PAUSE) {
                this.continue();
            }
        }, milliseconds);
    }

    public input(inf: string): void {
        this.inf = inf;
        this.status = status.INPUT;
    }

    public quit(): void {
        this.status = status.QUIT;
    }

    public invRemove(item: string, quantity: number): void {
        this.Game.removeItem(item, quantity);
    }

    public invAdd(item: string, quantity: number): void {
        this.Game.addItem(item, quantity);
    }

    public print(text: string, ln: boolean): void {
        let color : string | number = this.Game.getVar('style_textcolor');

        let textColor : string = '';

        if (typeof color === 'string') {
            textColor = color;
        } else if (color > 0) {
            const red = (color >> 16) & 0xff;
            const green = (color >> 8) & 0xff;
            const blue = color & 0xff;

            textColor = `rgb(${blue}, ${green}, ${red})`;
        }

        this._text.push({
            text,
            ln,
            color: textColor
        });
    }

    public btn(command: string, desc: string): void {
        const id = this._buttons.length;

        this._buttons.push({
            id,
            command,
            desc
        });
    }

    public link(text: string, command: string): string {
        let id: number = Object.keys(this.links).length;

        this.links[id] = command;

        return Client.generateLink(text, id);
    }

    public getStatus(): status {
        return this.status;
    }

    /**
     * сохранение
     */
    public save(): savedGameInterface {
        return {
            status: this.getStatus(),
            text: this._text,
            buttons: this._buttons,
            items: this.Game.items,
            vars: this.Game.vars,
            position: this.Game.position,
        };
    }

    /**
     * загрузка
     */
    public load(data: savedGameInterface): void {
        this.status = data.status;
        this._text = data.text;
        this._buttons = data.buttons;
        this.Game.items = data.items;
        this.Game.vars = data.vars;
        this.Game.position = data.position;
    }

    public setMode(mode: string): void {
        if (mode === modes.RIPURQ) {
            ModeUrqRip();
        }
        if (mode === modes.DOSURQ) {
            ModeUrqDos();
            this.setVar('style_backcolor', '#000');
            this.setVar('style_textcolor', '#FFF');
        }
    }
}
