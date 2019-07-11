import Quest from "./Quest";
import ModeUrqRip from "../modes/urqrip";
import ModeUrqDos from "../modes/urqdos";
import {modes} from "./Player";
import {ClientInterface} from "../interfaces/ClientInterface";
import {dosColorToHex} from "../tools";
import Inventory from "./Inventory";

export interface VarInterface {
    [key: string]: GameVarValue
}

export type GameVarValue = string | number;

export interface SystemVarInterface {
    defaultValue: GameVarValue,
    value: GameVarValue,
    setCallback: ((varname: string, value: GameVarValue) => void) | null,
    getCallback: ((varname: string) => GameVarValue) | null,
}

export interface ResourceInterface {
    [key: string]: string
}

/**
 * Игра (состояние)
 */
export default class Game {
    get quest(): Quest {
        return this._quest;
    }

    get name(): string {
        return this._name;
    }

    public client: ClientInterface;

    protected locked: boolean = true;

    public resources: ResourceInterface = {};

    public inventory: Inventory;

    public vars: VarInterface = {};

    protected systemVars: { [key: string]: SystemVarInterface } = {
        urq_mode: {
            defaultValue: '',
            value: '',
            // @ts-ignore
            setCallback: (varname: string, value: GameVarValue) => {
                if (value === modes.RIPURQ) {
                    ModeUrqRip();
                }
                if (value === modes.DOSURQ) {
                    ModeUrqDos();
                    this.setVar('style_backcolor', '#000');
                    this.setVar('style_textcolor', '#FFF');
                }
            },
            getCallback: null,
        },
        time: {
            defaultValue: '',
            value: '',
            setCallback: null,
            getCallback: () => {
                const Datetime = new Date();
                return (
                    Datetime.getHours() * 3600 +
                    Datetime.getMinutes() * 60 +
                    Datetime.getSeconds()
                );
            }
        },
        tokens_delim: {
            defaultValue: ' ,"?!',
            value: '',
            setCallback: null,
            getCallback: null,
        },
        music: {
            defaultValue: 0,
            value: '',
            // @ts-ignore
            setCallback: (varname: string, src: GameVarValue) => {
                this.client.player.playMusic(String(src));
            },
            getCallback: null,
        },
        current_loc: {
            defaultValue: 0,
            value: '',
            setCallback: null,
            getCallback: null,
        },
        previous_loc: {
            defaultValue: 0,
            value: '',
            setCallback: null,
            getCallback: null,
        },
        rnd: {
            defaultValue: '',
            value: '',
            setCallback: null,
            getCallback: () => {
                return Math.random();
            },
        },
        style_textcolor: {
            defaultValue: 0,
            value: '',
            setCallback: null,
            getCallback: null,
        },
        style_dos_textcolor: {
            defaultValue: 0,
            value: '',
            // @ts-ignore
            setCallback: (varname: string, value: GameVarValue) => {
                this.setVar("style_textcolor", dosColorToHex(Number(value)));
            },
            getCallback: null,
        },
        style_backcolor: {
            defaultValue: 0,
            value: '',
            setCallback: null,
            getCallback: null,
        },
        style_dos_backcolor: {
            defaultValue: 0,
            value: '',
            // @ts-ignore
            setCallback: (varname: string, value: GameVarValue) => {
                this.setVar("style_backcolor", dosColorToHex(Number(value)));
            },
            getCallback: null,
        },
        image: {
            defaultValue: 0,
            value: '',
            // @ts-ignore
            setCallback: (varname: string, value: GameVarValue) => {
                let file: string = String(value);
                if (this.resources != null) {
                    if (this.resources[file] !== undefined) {
                    } else if (this.resources[file + ".png"] !== undefined) {
                        file = file + ".png";
                    } else if (this.resources[file + ".jpg"] !== undefined) {
                        file = file + ".jpg";
                    } else if (this.resources[file + ".gif"] !== undefined) {
                        file = file + ".gif";
                    }
                }

                this.client.player.image(file);
            },
            getCallback: null,
        },
        common: {
            defaultValue: 0,
            value: '',
            setCallback: null,
            getCallback: null,
        },
    };

    protected systemVarsNotExact: { [key: string]: SystemVarInterface } = {
        'rnd[number]': {
            defaultValue: '',
            value: '',
            setCallback: null,
            getCallback: (varname : string) : GameVarValue => {
                const rndmaxValue = varname.match(/rnd([0-9+])/i);
                return Math.floor(Math.random() * Number((rndmaxValue as any)[1])) + 1
            },
        },
        'count_[location]': {
            defaultValue: 0,
            value: '',
            setCallback: null,
            getCallback: null,
        },
        item: {
            defaultValue: 0,
            value: '',
            setCallback: (varname : string, value: GameVarValue) : void => {
                if (varname.startsWith("inv_")) {
                    varname = varname.substr(4);
                }

                return this.inventory.setItem(varname, Number(value));
            },
            getCallback: (varname : string) : GameVarValue => {
                if (varname.startsWith("inv_")) {
                    varname = varname.substr(4);
                }

                return this.inventory.getItemQuantity(varname);
            },
        },
    };

    /**
     * имя игры или файла для сохранения
     */
    private _name: string = '';

    /**
     * хранилище файла квеста
     */
    private _quest: Quest;

    public position: number = 0;

    constructor(name: string, qst: string, Client: ClientInterface) {
        this.client = Client;
        this._name = name;
        this._quest = new Quest(qst);
        this.inventory = new Inventory(this._quest.useLabels);

        this.clean();
    }

    public setVar(variable: string, value: GameVarValue) {
        variable = variable.toLowerCase();

        let systemVar = this.getSystemVar(variable);
        if (systemVar !== null) {
            if (typeof systemVar.setCallback === 'function') {
                systemVar.setCallback(variable, value);
            } else {
                systemVar.value = value;
            }
        } else {
            this.vars[variable] = value;
        }
    }

    public getVar(variable: string): GameVarValue {
        variable = variable.toLowerCase();

        let systemVar = this.getSystemVar(variable);
        if (systemVar !== null) {
            if (typeof systemVar.getCallback === 'function') {
                return systemVar.getCallback(variable);
            } else {
                return this.systemVars[variable].value;
            }
        }

        // todo костыль Для выражений вроде "1 деньги"
        if (variable.split(" ").length > 1) {
            const count = variable.split(" ")[0];
            if (!isNaN(count as any)) {
                variable = variable
                    .split(" ")
                    .slice(1)
                    .join(" ")
                    .trim();
                return (this.vars[variable] >= count) ? 1 : 0;
            }
        }

        if (this.vars[variable] !== undefined) {
            return this.vars[variable];
        }

        return 0;
    }

    /**
     * очистка
     */
    public clean(): void {
        this.position = 0;
        this.inventory.items = {};
        this.vars = {};

        this.resetSystemVars();
    }

    public isLocked(): boolean {
        return this.locked;
    }

    public setLocked(locked: boolean = true): void {
        this.locked = locked;
    }

    protected getSystemVar(variable: string): SystemVarInterface | null {
        if (this.systemVars[variable] !== undefined) {
            return this.systemVars[variable];
        }

        if (variable.startsWith("inv_") || this.inventory.items[variable.toLowerCase()] !== undefined) {
            return this.systemVarsNotExact['item'];
        }

        if (/rnd([0-9+])/i.test(variable)) {
            return this.systemVars['rnd[number]'];
        }

        return null;
    }

    protected resetSystemVars(): void {
        for (let key in this.systemVars) {
            this.systemVars[key].value = this.systemVars[key].defaultValue;
        }
        for (let key in this.systemVarsNotExact) {
            this.systemVarsNotExact[key].value = this.systemVarsNotExact[key].defaultValue;
        }

        this.systemVars["current_loc"].value = this._quest.firstLabel;
        this.systemVars["previous_loc"].value = this._quest.firstLabel;
    }
}