import Client from "../core/Client";
import {ContentInterface, status} from "../core/Player";

export default class ConsoleClient extends Client {
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

    /**
     * рендер
     */
    public render(): void {
        this._text = this.player.text;
        this._buttons = this.player.buttons;
        this._links = this.player.links;
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
