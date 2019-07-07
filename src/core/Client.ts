import Player, {
    status,
    SavedGameInterface,
    ContentInterface, ButtonInterface,
    LinkInterface
} from "./Player";
import Game from "./Game";
import {ClientInterface} from "../interfaces/ClientInterface";

export default abstract class Client implements ClientInterface{
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
    protected player: Player;

    /**
     * инстанс игры
     */
    protected game: Game;

    protected _text: ContentInterface[] = [];

    protected _buttons: ButtonInterface[] = [];

    protected _links: LinkInterface = [];

    protected constructor(gameInstance: Game) {
        this.game = gameInstance;
        this.player = new Player(this.game, this);
        this.player.continue()
    }

    /**
     * "закрыть" игру
     */
    abstract close(): boolean;

    abstract restartGame(): ClientInterface | null;

    /**
     * btn
     */
    public btnClick(action: number): void {
        if (this.game.isLocked()) {
            return;
        }

        this.player.action(action);
    }

    /**
     * link
     */
    public linkClick(action: number): void {
        if (this.game.isLocked()) {
            return;
        }

        this.player.action(action, true);
    }

    /**
     * link
     */
    public anykeyDone(keyCode: string): void {
        if (this.isStatusAnykey()) {
            this.player.anykeyAction(keyCode);
        }

        return;
    }

    /**
     * link
     */
    public inputDone(text: string) : void {
        if (this.isStatusInput()) {
            return this.player.inputAction(text);
        }

        return;
    }

    public isStatusInput(): boolean {
        return this.player.getStatus() === status.INPUT;
    }

    public isStatusAnykey(): boolean {
        return this.player.getStatus() === status.ANYKEY;
    }

    public getGameName(): string {
        return this.game.name;
    }

    public saveGame(): SavedGameInterface | null {
        if (this.game.isLocked()) {
            return null;
        }

        return this.player.save();
    }

    public loadGame(data: SavedGameInterface): boolean {
        if (this.game.isLocked()) {
            return false;
        }

        this.player.load(data);

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
        this._text = this.player.text;
        this._links = this.player.links;
        this._buttons = this.player.buttons;
    }

    abstract isTimer() : boolean;
    abstract removeTimer() : void;
    abstract setTimer(callback: () => void, milliseconds : number) : void;
}
