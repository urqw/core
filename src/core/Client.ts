import Player, {
    status,
    SavedGameInterface,
    ContentInterface, ButtonInterface,
    LinkInterface
} from "./Player";
import Game, {ResourceInterface} from "./Game";
import {ClientInterface} from "../interfaces/ClientInterface";

export default abstract class Client implements ClientInterface{
    get player(): Player {
        return this._player;
    }
    get buttons(): ButtonInterface[] {
        return this._buttons;
    }

    get text(): ContentInterface[] {
        return this._text;
    }

    get links(): LinkInterface {
        return this._links;
    }

    /**
     * проигрыватель
     */
    protected _player: Player;

    /**
     * инстанс игры
     */
    protected game: Game;

    protected _text: ContentInterface[] = [];

    protected _buttons: ButtonInterface[] = [];

    protected _links: LinkInterface = [];

    public constructor(questname: string, quest: string, resources: ResourceInterface, mode: string = "urqw") {
        const gameInstance : Game = new Game(questname, quest, this);
        gameInstance.resources = resources;
        gameInstance.setVar("urq_mode", mode);

        this.game = gameInstance;
        this._player = new Player(this.game, this);
        this._player.continue();
    }

    /**
     * "закрыть" игру
     */
    abstract close(): boolean;

    public restartGame(): void {
        if (this.close()) {
            this.game.clean();
        }

        this._player = new Player(this.game, this);
        this._player.continue();
    }

    /**
     * btn
     */
    public btnClick(action: number): void {
        if (this.game.isLocked()) {
            return;
        }

        this._player.action(action);
    }

    /**
     * link
     */
    public linkClick(action: number): void {
        if (this.game.isLocked()) {
            return;
        }

        this._player.action(action, true);
    }

    /**
     * link
     */
    public anykeyDone(keyCode: string): void {
        if (this.isStatusAnykey()) {
            this._player.anykeyAction(keyCode);
        }

        return;
    }

    /**
     * link
     */
    public inputDone(text: string) : void {
        if (this.isStatusInput()) {
            return this._player.inputAction(text);
        }

        return;
    }

    public isStatusInput(): boolean {
        return this._player.getStatus() === status.INPUT;
    }

    public isStatusAnykey(): boolean {
        return this._player.getStatus() === status.ANYKEY;
    }

    public getGameName(): string {
        return this.game.name;
    }

    public saveGame(): SavedGameInterface | null {
        if (this.game.isLocked()) {
            return null;
        }

        return this._player.save();
    }

    public loadGame(data: SavedGameInterface): boolean {
        if (this.game.isLocked()) {
            return false;
        }

        this._player.load(data);

        this.render();

        return true;
    }

    abstract getLineBreakSymbol() : string;

    abstract generateLink(text: string, action: number): string;

    abstract removeLinks(text: ContentInterface[]): ContentInterface[];

    /**
     * рендер
     */
    public render(): void {
        this._text = this._player.text;
        this._links = this._player.links;
        this._buttons = this._player.buttons;
    }

    abstract isTimer() : boolean;
    abstract removeTimer() : void;
    abstract setTimer(callback: () => void, milliseconds : number) : void;
}
