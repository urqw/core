import Client from "../core/Client";
import {ContentInterface, status} from "../core/Player";
import Game from "../core/Game";
import {ClientInterface} from "../interfaces/ClientInterface";

export default class ConsoleClient extends Client {
    /**
     * инстанс новой игры
     */
    public static createGame(questname: string, quest: string, mode: string = "urqw"): ClientInterface {
        const GameInstance : Game = new Game(questname, quest);
        GameInstance.setVar("urq_mode", mode);

        return new this(GameInstance);
    }

    /**
     * "закрыть" игру
     */
    public close(): boolean {
        return this.player.getStatus() !== status.NEXT;
    }

    public restartGame(): ConsoleClient | null {
        if (this.close()) {
            this.player.restart();

            return new ConsoleClient(this.game);
        }

        return null;
    }

    public getLineBreakSymbol() {
        return "\n";
    }

    /**
     * превратить текст и комманду в линк
     */
    public generateLink(text: string): string {
        return text;
    }

    public removeLinks(text: ContentInterface[]): ContentInterface[] {
        return text;
    }

    /**
     * рендер
     */
    public render(): void {
        this._text = this.player.text;
        this._buttons = this.player.buttons;
        this._links = this.player.links;
    }
}
