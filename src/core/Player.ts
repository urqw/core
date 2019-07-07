import Parser from "./Parser";
import Client from "./Client";
import {dosColorToHex, intColorToRgb} from "../tools";
import Game, {ItemInterface, VarInterface} from "./Game";
import ModeUrqRip from "../modes/urqrip";
import ModeUrqDos from "../modes/urqdos";
import {ClientInterface} from "../interfaces/ClientInterface";
import WebClient from "../clients/WebClient";

export enum modes {
    RIPURQ = 'ripurq',
    DOSURQ = 'dosurq',
    URQW = 'urqw',
}

export interface SavedGameInterface {
    status: status,
    text: ContentInterface[],
    buttons: ButtonInterface[],
    items: ItemInterface,
    vars: VarInterface,
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

export interface ContentInterface {
    img?: string,
    text?: string,
    ln?: boolean,
    color?: string
}

export interface ButtonInterface {
    id: number,
    command: string,
    desc: string,
}

export interface LinkInterface {
    [key: number]: string
}

export default class Player {
    get links(): LinkInterface {
        return this._links;
    }
    get text(): ContentInterface[] {
        return this._text;
    }

    get buttons(): ButtonInterface[] {
        return this._buttons;
    }

    public client: ClientInterface;
    public game: Game;
    protected parser: Parser;

    private _text: ContentInterface[] = [];
    private _buttons: ButtonInterface[] = [];
    private _links: LinkInterface = {};

    protected status: status = status.NEXT;
    protected inf: string = '';
    protected timer: number = 0; //todo

    protected procPosition: number[] = [];

    public flow: number = 0;
    public flowStack: { [key: number]: string[] } = {};

    constructor(Game: Game, Client: Client) {
        this.flowStack[this.flow] = [];

        this.game = Game;
        this.restart();
        this.client = Client;
        this.parser = new Parser(this, this.game);
    }

    /**
     * перезапуск
     */
    public restart(): void {
        this.game.clean();

        this.game.setVar("current_loc", this.game.quest.firstLabel);
        this.game.setVar("previous_loc", this.game.quest.firstLabel);
    }

    public continue(): void {
        this.play();

        this.fin();
    }

    /**
     * рендер
     */
    protected fin(): void {
        if (this.game.getVar("music")) {
            this.playMusic(String(this.game.getVar("music")), true);
        }

        if (this.status !== status.NEXT) {
            this.client.render();
        }

        this.game.setLocked(!(
            this.status === status.END ||
            this.status === status.PAUSE
        ));
    }

    public play(line: string | null = null): void {
        this.game.setLocked();

        this.status = status.NEXT;

        if (line !== null) {
            this.parser.parse(line);
        }

        while (this.status === status.NEXT) {
            if (
                this.flowStack[this.flow].length === 0 &&
                (line = this.next()) !== null
            ) {
                this.parser.parse(line);
            }

            while (this.flowStack[this.flow].length > 0 && this.status === status.NEXT) {
                this.parser.parse(this.flowStack[this.flow].pop()!); // todo !
            }
        }
    }

    /**
     * следующая строка
     */
    public next(): string | null {
        let line = this.game.quest.get(this.game.position);

        this.game.position++;

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

        if (this.game.getVar("common") !== 0) {
            commonLabel = commonLabel + "_" + this.game.getVar("common");
        }

        if (this.proc(commonLabel)) {
            this.forgetProcs();
            this.play();
        }
    }

    public action(actionId: number, link: boolean = false): void {
        let label: string | null = null;
        if (link) {
            label = this._links[actionId];
            delete this._links[actionId];
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

        let labelPosition: number | null = this.game.quest.getLabelPosition(label);

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
            this.game.setVar(this.inf, keycode);
        }

        this.continue();
    }

    public inputAction(value: string): void {
        this.game.setVar(this.inf, value);

        this.continue();
    }

    public setVar(variable: string, value: string | number): void {
        variable = variable.trim();

        if (variable.toLowerCase() === "style_dos_textcolor") {
            this.game.setVar("style_textcolor", dosColorToHex(+value)); // todo +
        } else if (variable.toLowerCase() === "image") {
            let file : string = String(value);
            if (this.game.resources != null) {
                if (this.game.resources[file] !== undefined) {
                } else if (this.game.resources[file + ".png"] !== undefined) {
                    file = file + ".png";
                } else if (this.game.resources[file + ".jpg"] !== undefined) {
                    file = file + ".jpg";
                } else if (this.game.resources[file + ".gif"] !== undefined) {
                    file = file + ".gif";
                }
            }

            this.image(file);
        }

        this.game.setVar(variable, value);
    }

    public image(src: string): void {
        if (src && this.game.resources[src]) {
            this._text.push({
                img: this.game.resources[src]
            });
        }
    }

    public playMusic(src: string, loop: boolean): void {
        // todo это что-то вроде детекта имплемента MediaClientInterface
        if ((this.client as WebClient).gameMusic === undefined) {
            return;
        }

        let file : string;

        if (this.game.resources === null) {
            file = "quests/" + this.game.name + "/" + src;
        } else {
            file = this.game.resources[src];
        }

        // todo костыли TS, не примает интерфейс
        const gameMusic = (this.client as WebClient).gameMusic;

        if (src) {
            if (gameMusic.getAttribute("src") !== file) {
                gameMusic.src = file;

                if (loop) {
                    gameMusic.addEventListener(
                        "ended",
                        () => {
                            gameMusic.src = file;
                            gameMusic.play();
                        },
                        false
                    );
                }

                gameMusic.play();
            }
        } else {
            gameMusic.pause();
        }
    }

    public playSound(src: string): void {
        // todo это что-то вроде детекта имплемента MediaClientInterface
        if ((this.client as WebClient).gameMusic === undefined) {
            return;
        }

        let source;
        if (this.game.resources === null) {
            source = "quests/" + this.game.name + "/" + src;
        } else {
            source = this.game.resources[src];
        }

        // todo костыли TS, не примает интерфейс
        let Sound = (this.client as WebClient).getNewSound(source);

        // todo костыли TS, не примает интерфейс
        Sound.volume = (this.client as WebClient).getVolume();
        Sound.play();
    }

    /**
     * прыгнуть на метку
     */
    public goto(labelName: string, type: gotoType): boolean {
        let labelPosition: number | null = this.game.quest.getLabelPosition(labelName);

        if (labelPosition === null) {
            return false;
        }

        if (type === gotoType.BTN || type === gotoType.GOTO) {
            this.game.setVar("previous_loc", this.game.getVar("current_loc"));
            this.game.setVar("current_loc", labelName);
        }

        if (type === gotoType.BTN || type === gotoType.GOTO || type === gotoType.PROC) {
            let labelCounter : number = +this.game.getVar("count_" + labelName);

            this.game.setVar("count_" + labelName, labelCounter + 1);
        }

        this.game.position = labelPosition;

        // весь стек что дальше очищается
        this.flowStack[this.flow] = [];

        return true;
    }

    /**
     * удаление переменных
     */
    public perkill(): void {
        this.game.vars = {};

        for (let key in this.game.items) {
            this.game.setVar(key, this.game.items[key]);
        }
    }

    public cls(): void {
        this._text = [];
        this._buttons = [];
        this._links = {};

        this.client.render();
    }

    public clsb(): void {
        this._buttons = [];
        this._links = {};

        this._text = this.client.removeLinks(this._text);

        this.client.render();
    }

    public invkill(item : string | null = null): void {
        if (item === null) {
            for (let key in this.game.items) {
                this.game.setItem(key, 0);
            }
        } else {
            this.game.setItem(item, 0);
        }
    }

    /**
     * прок
     */
    public proc(label: string): boolean {
        this.flow++;
        this.procPosition.push(this.game.position);

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
            this.game.position = this.procPosition.pop()!; // todo !
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
        this.game.removeItem(item, quantity);
    }

    public invAdd(item: string, quantity: number): void {
        this.game.addItem(item, quantity);
    }

    public print(text: string, ln: boolean): void {
        const color : string | number = this.game.getVar('style_textcolor');

        let textColor : string = '';

        if (typeof color === 'string') {
            textColor = color;
        } else if (color > 0) {
            textColor = intColorToRgb(color);
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
        let id: number = Object.keys(this._links).length;

        this._links[id] = command;

        return this.client.generateLink(text, id);
    }

    public getStatus(): status {
        return this.status;
    }

    /**
     * сохранение
     */
    public save(): SavedGameInterface {
        return {
            status: this.getStatus(),
            text: this._text,
            buttons: this._buttons,
            items: this.game.items,
            vars: this.game.vars,
            position: this.game.position,
        };
    }

    /**
     * загрузка
     */
    public load(data: SavedGameInterface): void {
        this.status = data.status;
        this._text = data.text;
        this._buttons = data.buttons;
        this.game.items = data.items;
        this.game.vars = data.vars;
        this.game.position = data.position;
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
