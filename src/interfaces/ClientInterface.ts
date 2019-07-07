import {
    SavedGameInterface,
    ContentInterface, ButtonInterface,
    LinkInterface
} from "../core/Player";
import {ClientInterface} from "./ClientInterface";

export interface ClientInterface {
    readonly buttons: ButtonInterface[];

    readonly text: ContentInterface[];

    readonly links: LinkInterface;

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

    restartGame(): ClientInterface | null;

    getLineBreakSymbol(): string;

    generateLink(text: string, action: number): string;

    removeLinks(text: ContentInterface[]): ContentInterface[];

    /**
     * рендер
     */
    render(): void;
}
