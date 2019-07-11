import Client from "../core/Client";
import {ContentInterface, status} from "../core/Player";
import {ResourceInterface} from "../core/Game";

export default class ConsoleClient extends Client {

    constructor(questname: string, quest: string, resources: ResourceInterface, mode: string = "urqw") {
        super(questname, quest, resources, mode);
        this._player.continue();
    }

    /**
     * "закрыть" игру
     */
    public close(): boolean {
        return this.player.getStatus() !== status.NEXT;
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

    // todo not implemented yet
    isTimer(): boolean {
        return false;
    }

    // todo not implemented yet
    removeTimer(): void {
    }

    // todo not implemented yet
    // @ts-ignore
    setTimer(callback: () => void, milliseconds: number): void {
    }
}
