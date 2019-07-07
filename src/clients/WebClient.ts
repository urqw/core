import { intColorToRgb } from "../tools";
import Client from "../core/Client";
import {ContentInterface, status} from "../core/Player";
import Game, {ResourceInterface} from "../core/Game";
import {ClientInterface} from "../interfaces/ClientInterface";
import {MediaClientInterface} from "../interfaces/MediaClientInterface";

interface GameStyle {
    backgroundColor: string,
    textColor: string
}

export default class WebClient extends Client implements MediaClientInterface{
    get style(): GameStyle {
        return this._style;
    }

    protected timer : number = 0;

    public gameMusic = new Audio();
    protected volume: number = 1;

    private _style: GameStyle = {
        backgroundColor: '',
        textColor: '',
    };

    /**
     * инстанс новой игры
     */
    public static createGame(questname: string, quest: string, resources: ResourceInterface, mode: string = "urqw"): ClientInterface {
        const GameInstance : Game = new Game(questname, quest);
        GameInstance.resources = resources;
        GameInstance.setVar("urq_mode", mode);

        return new this(GameInstance);
    }

    /**
     * "закрыть" игру
     */
    public close(): boolean {
        if (this.player.getStatus() === status.NEXT) {
            return false;
        }

        this.gameMusic.pause();

        return true;
    }

    public getVolume(): number {
        return this.volume;
    }

    public setVolume(volume: number): void {
        this.volume = volume;
        this.gameMusic.volume = this.volume;
    }

    public restartGame(): WebClient | null {
        if (this.close()) {
            this.player.restart();

            return new WebClient(this.game);
        }

        return null;
    }

    public getLineBreakSymbol() {
        return "<br>";
    }

    /**
     * превратить текст и комманду в <a> тег
     */
    public generateLink(text: string, action: number): string {
        return "<a data-action='" + action + "'>" + text + "</a>";
    }

    public removeLinks(text: ContentInterface[]): ContentInterface[] {
        for (let i : number = 0; i < text.length; i++) {
            if (text[i].text !== undefined) {
                text[i].text = text[i].text!.replace(
                    /<a.+?>(.+?)<\/a>/gi,
                    '$1'
                );
            }
        }

        return text;
    }

    protected setBackColor(): void {
        const styleBackcolor : string | number = this.game.getVar('style_backcolor');

        if (typeof styleBackcolor === 'string') {
            this._style.backgroundColor = styleBackcolor;
        } else if (styleBackcolor > 0) {
            this._style.backgroundColor = intColorToRgb(styleBackcolor);
        }
    }

    /**
     * рендер
     */
    public render(): void {
        // костыли для <img> тега
        let text = this.player.text;
        for (let i = 0; i < text.length; i++) {
            if (text[i].text !== undefined) {
                let regex = /(<img[^>]+src=")([^">]+)"/i;
                if (regex.test(text[i].text!)) {
                    let src = text[i].text!.match(regex);
                    if (src !== null) {
                        text[i].text = text[i].text!.replace(
                            /(<img[^>]+src=")([^">]+)"/gi,
                            '$1' + this.game.resources[src[2]] + "\""
                        );

                    }
                }
            }
        }

        this._text = text;
        this._buttons = this.player.buttons;
        this._links = this.player.links;
        this.setBackColor();
    }

    public getNewSound(src: string): HTMLAudioElement {
        return new Audio(src);
    }

    public isTimer() : boolean {
        return this.timer !== null;
    };

    public removeTimer() : void {
        clearTimeout(this.timer)
    };

    public setTimer(callback: () => void, milliseconds : number) : void {
        this.timer = window.setTimeout(callback, milliseconds);
    };
}
