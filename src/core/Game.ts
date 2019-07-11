import Quest from "./Quest";
import ModeUrqRip from "../modes/urqrip";
import ModeUrqDos from "../modes/urqdos";
import {modes} from "./Player";
import {ClientInterface} from "../interfaces/ClientInterface";
import {dosColorToHex} from "../tools";

export interface ItemInterface {
    [key: string]: number
}

export interface VarInterface {
    [key: string]: string | number
}

export interface SystemVarInterface {
    defaultValue: string | number,
    value: string | number,
    setCallback: ((value: string | number) => void) | null,
    getCallback: (() => string | number) | null,
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

    public items: ItemInterface = {};

    public vars: VarInterface = {};

    protected systemVars: { [key: string]: SystemVarInterface } = {
        'urq_mode': {
            'defaultValue': '',
            'value': '',
            'setCallback': (value: string | number) => {
                if (value === modes.RIPURQ) {
                    ModeUrqRip();
                }
                if (value === modes.DOSURQ) {
                    ModeUrqDos();
                    this.setVar('style_backcolor', '#000');
                    this.setVar('style_textcolor', '#FFF');
                }
            },
            'getCallback': null,
        },
        'time': {
            'defaultValue': '',
            'value': '',
            'setCallback': null,
            'getCallback': () => {
                const Datetime = new Date();
                return (
                    Datetime.getHours() * 3600 +
                    Datetime.getMinutes() * 60 +
                    Datetime.getSeconds()
                );
            }
        },
        'tokens_delim': {
            'defaultValue': ' ,"?!',
            'value': '',
            'setCallback': null,
            'getCallback': null,
        },
        'music': {
            'defaultValue': 0,
            'value': '',
            'setCallback': (src: string | number) => {
                this.client.player.playMusic(String(src));
            },
            'getCallback': null,
        },
        'current_loc': {
            'defaultValue': 0,
            'value': '',
            'setCallback': null,
            'getCallback': null,
        },
        'previous_loc': {
            'defaultValue': 0,
            'value': '',
            'setCallback': null,
            'getCallback': null,
        },
        'rnd': {
            'defaultValue': '',
            'value': '',
            'setCallback': null,
            'getCallback': () => {
                return Math.random();
            },
        },
        'rnd[0-9+]': {
            'defaultValue': '',
            'value': '',
            'setCallback': null,
            'getCallback': () => {
                return Math.floor(Math.random() * Number(this.systemVars['rnd[0-9+]'].value)) + 1
            },
        },
        'style_textcolor': {
            'defaultValue': 0,
            'value': '',
            'setCallback': null,
            'getCallback': null,
        },
        'style_dos_textcolor': {
            'defaultValue': 0,
            'value': '',
            'setCallback': (value: string | number) => {
                this.setVar("style_textcolor", dosColorToHex(Number(value)));
            },
            'getCallback': null,
        },
        'style_backcolor': {
            'defaultValue': 0,
            'value': '',
            'setCallback': null,
            'getCallback': null,
        },
        'style_dos_backcolor': {
            'defaultValue': 0,
            'value': '',
            'setCallback': (value: string | number) => {
                this.setVar("style_backcolor", dosColorToHex(Number(value)));
            },
            'getCallback': null,
        },
        'image': {
            'defaultValue': 0,
            'value': '',
            'setCallback': (value: string | number) => {
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
            'getCallback': null,
        },
        'common': {
            'defaultValue': 0,
            'value': '',
            'setCallback': null,
            'getCallback': null,
        },
        'count_[.+]': {
            'defaultValue': 0,
            'value': '',
            'setCallback': null,
            'getCallback': null,
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

        this.clean();
    }

    public addItem(name: string, count: number): void {
        this.setItem(name, this.getItem(name) + count);
    }

    public removeItem(name: string, count: number): void {
        this.setItem(name, this.getItem(name) - count);
    }

    public setItem(name: string, count: number): void {
        if (count <= 0) {
            delete this.items[name];
            this.setVar(name, 0);
        } else {
            this.items[name] = count;
            this.setVar(name, count);
        }
    }

    public getItem(name: string): number {
        return this.items[name] === undefined ? 0 : this.items[name];
    }

    public setVar(variable: string, value: string | number) {
        variable = variable.toLowerCase();

        let systemVar = this.getSystemVar(variable);
        if (systemVar !== null) {
            if (typeof systemVar.setCallback === 'function') {
                systemVar.setCallback(value);
            } else {
                systemVar.value = value;
            }
        } else {
            if (variable.startsWith("inv_")) {
                variable = variable.substr(4);

                this.setItem(variable, Number(value));
            } else {
                this.vars[variable] = value;
            }
        }
    }

    public getVar(variable: string): string | number {
        variable = variable.toLowerCase();

        let systemVar = this.getSystemVar(variable);
        if (systemVar !== null) {
            if (typeof systemVar.getCallback === 'function') {
                return systemVar.getCallback();
            } else {
                return this.systemVars[variable].value;
            }
        }

        if (variable.startsWith("inv_")) {
            variable = variable.substr(4);
        }

        /*

                // Для выражений вроде "1 деньги"
                if (variable.split(" ").length > 1) {
                    const count = variable.split(" ")[0];
                    if (!isNaN(count)) {
                        variable = variable
                            .split(" ")
                            .slice(1)
                            .join(" ")
                            .trim();
                        return this._vars[variable] >= count;
                    }
                }
        */

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
        this.items = {};
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

        const regex = /rnd([0-9+])/i;
        const result = variable.match(regex);
        if (result !== null) {
            this.systemVars['rnd[0-9+]'].value = result[1];
            return this.systemVars['rnd[0-9+]'];
        }

        return null;
    }

    protected resetSystemVars(): void {
        for (let key in this.systemVars) {
            this.systemVars[key].value = this.systemVars[key].defaultValue;
        }

        this.systemVars["current_loc"].value = this._quest.firstLabel;
        this.systemVars["previous_loc"].value = this._quest.firstLabel;
    }
}