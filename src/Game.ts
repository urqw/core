import Quest from "./Quest";

export interface ItemInterface {
    [key: string]: number
}

export interface VarInterface {
    [key: string]: string | number
}

export interface SystemVarInterface {
    [key: string]: {
        defaultValue : string | number,
        value : string | number,
        setCallback : ((value: string | number) => void) | null,
        getCallback : (() => string | number) | null,
    }
}

export interface ResourceInterface {
    [key: string]: string
}

/**
 * Игра (состояние)
 */
export default class Game {
    get resources(): ResourceInterface {
        return this._resources;
    }

    set resources(value: ResourceInterface) {
        this._resources = value;
    }

    get position(): number {
        return this._position;
    }

    set position(value: number) {
        this._position = value;
    }

    get vars(): VarInterface {
        return this._vars;
    }

    set vars(value: VarInterface) {
        this._vars = value;
    }

    get items(): ItemInterface {
        return this._items;
    }

    set items(value: ItemInterface) {
        this._items = value;
    }

    get quest(): Quest {
        return this._quest;
    }

    get name(): string {
        return this._name;
    }

    protected locked: boolean = true;

    private _resources: ResourceInterface = {};

    private _items: ItemInterface = {};

    private _vars: VarInterface = {};

    protected systemVars: SystemVarInterface = {
        'urq_mode': {
            'defaultValue' : '',
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'time': {
            'defaultValue' : '',
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'tokens_delim': {
            'defaultValue' : ' ,"?!',
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'music': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'current_loc': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'previous_loc': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'count_': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'rnd': {
            'defaultValue' : '',
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'style_textcolor': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'style_dos_textcolor': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'style_backcolor': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'style_dos_backcolor': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
        },
        'common': {
            'defaultValue' : 0,
            'value' : '',
            'setCallback' : null,
            'getCallback' : null,
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

    private _position: number = 0;

    constructor(name: string, qst: string) {
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
            delete this._items[name];
            this.setVar(name, 0);
        } else {
            this._items[name] = count;
            this.setVar(name, count);
        }
    }

    public getItem(name: string): number {
        return this._items[name] === undefined ? 0 : this._items[name];
    }

    public setVar(variable: string, value: string | number) {
        variable = variable.toLowerCase();

        if (this.systemVars[variable] !== undefined) {
            let callback = this.systemVars[variable].setCallback;
            if (typeof callback === 'function') {
                callback(value);
            }
        } else {
            if (variable.substr(0, 4) === "inv_") {
                variable = variable.substr(4);

                this.setItem(variable, Number(value));
            } else {
                this._vars[variable] = value;
            }
        }
    }

    public getVar(variable: string): string | number {
        variable = variable.toLowerCase();

        if (this.systemVars[variable] !== undefined) {
            let callback = this.systemVars[variable].getCallback;
            if (typeof callback === 'function') {
                return callback();
            }
        }

        if (variable.substr(0, 4) === "inv_") {
            variable = variable.substr(4);
        }

        if (variable === "rnd") {
            return Math.random();
        } else if (variable.substr(0, 3) === "rnd") {
            return Math.floor(Math.random() * parseInt(variable.substr(3))) + 1;
        }

        if (variable === "time") {
            let Datetime = new Date();
            return (
                Datetime.getHours() * 3600 +
                Datetime.getMinutes() * 60 +
                Datetime.getSeconds()
            );
        }
/*

        // Для выражений вроде "1 деньги"
        if (variable.split(" ").length > 1) {
            let count = variable.split(" ")[0];
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

        if (this._vars[variable] !== undefined) {
            return this._vars[variable];
        }

        return 0;
    }

    /**
     * очистка
     */
    public clean(): void {
        this._position = 0;
        this._items = {};
        this._vars = {};

        for (let key in this.systemVars) {
            this.systemVars[key].value = this.systemVars[key].defaultValue;
        }

        this.setVar("current_loc", this._quest.firstLabel);
        this.setVar("previous_loc", this._quest.firstLabel);
    }

    public isLocked(): boolean {
        return this.locked;
    }

    public setLocked(locked: boolean = true): void {
        this.locked = locked;
    }
}