import Player, {
    SavedGameInterface,
    ContentInterface, ButtonInterface,
    LinkInterface
} from "../core/Player";
import {ClientInterface} from "./ClientInterface";

export interface ClientInterface {
    readonly buttons: ButtonInterface[];

    readonly text: ContentInterface[];

    readonly links: LinkInterface;

    readonly player: Player;

    isTimer() : boolean;
    removeTimer() : void;
    setTimer(callback: () => void, milliseconds : number) : void;

    /**
     * "закрыть" игру
     */
    close(): boolean;

    /**
     * btn
     */
    btnClick(action: number): void;

    /**
     * link
     */
    linkClick(action: number): void;

    /**
     * link
     */
    anykeyDone(keyCode: string): void;

    /**
     * link
     */
    inputDone(text: string): void;

    isStatusInput(): boolean;

    isStatusAnykey(): boolean;

    getGameName(): string;

    saveGame(): SavedGameInterface | null;

    loadGame(data: SavedGameInterface): boolean;

    restartGame(): void;

    getLineBreakSymbol(): string;

    generateLink(text: string, action: number): string;

    removeLinks(text: ContentInterface[]): ContentInterface[];

    /**
     * рендер
     */
    render(): void;
}
