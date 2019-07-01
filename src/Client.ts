import Player, {status, savedGameInterface, contentInterface, buttonInterface} from "./Player";
import Game, {resourceInterface} from "./Game";

export default class Client {
    public static gameMusic = new Audio();
    public static volume: number = 1;

    /**
     * проигрыватель
     */
    protected Player: Player;
    /**
     * инстанс игры
     */
    protected Game: Game;

    protected text: contentInterface[] = [];

    protected buttons: buttonInterface[] = [];

    protected style: { backgroundColor: string, textColor: string } = {
        backgroundColor: '',
        textColor: '',
    };

    constructor(GameInstance: Game) {
        this.Game = GameInstance;
        this.Player = new Player(this.Game, this);
        this.Player.continue()
    }

    /**
     * инстанс новой игры
     */
    public static createGame(questname: string, quest: string, resources: resourceInterface, mode: string = "urqw"): Client {
        let GameInstance : Game = new Game(questname, quest);
        GameInstance.resources = resources;
        GameInstance.setVar('urq_mode', mode);

        return new Client(GameInstance);
    }

    /**
     * "закрыть" игру
     */
    public close(): void {
        Client.gameMusic.pause();
    }

    /**
     * btn
     */
    public btnClick(action: number): void {
        if (this.Game.isLocked()) {
            return;
        }

        this.Player.action(action);
    }

    /**
     * link
     */
    public linkClick(action: number): void {
        if (this.Game.isLocked()) {
            return;
        }

        this.Player.action(action, true);
    }

    /**
     * link
     */
    public anykeyDone(keyCode: string): void {
        if (this.isStatusAnykey()) {
            this.Player.anykeyAction(keyCode);
        }

        return;
    }

    /**
     * link
     */
    public inputDone(text: string) {
        if (this.isStatusInput()) {
            return this.Player.inputAction(text);
        }

        return false;
    }


    public isStatusInput(): boolean {
        return this.Player.getStatus() === status.INPUT;
    }

    public isStatusAnykey(): boolean {
        return this.Player.getStatus() === status.ANYKEY;
    }

    public getVolume(): number {
        return Client.volume;
    }

    public setVolume(volume: number): void {
        Client.volume = volume;
        Client.gameMusic.volume = Client.volume;
    }

    public getGameName(): string {
        return this.Game.name;
    }

    public saveGame(): savedGameInterface | null {
        if (this.Game.isLocked()) {
            return null;
        }

        return this.Player.save();
    }

    public loadGame(data: savedGameInterface): boolean {
        if (this.Game.isLocked()) {
            return false;
        }

        this.Player.load(data);

        this.render();

        return true;
    }

    public restartGame(): Client | null {
        if (this.Player.getStatus() === status.NEXT) {
            return null;
        }

        this.Player.restart();

        return new Client(this.Game);
    }

    public static getLineBreakSymbol() {
        return "<br>";
    }

    /**
     * превратить текст и комманду в <a> тег
     */
    public static generateLink(text: string, action: number): string {
        return "<a data-action='" + action + "'>" + text + "</a>";
    }

    public static removeLinks(text: contentInterface[]): contentInterface[] {
        for (let i : number = 0; i < text.length; i++) {
            if (text[i].text !== undefined) {
                text[i].text = text[i].text!.replace(
                    /\<a.+?\>(.+?)\<\/a\>/gi,
                    '$1'
                );
            }
        }

        return text;
    }

    protected setBackColor(): void {
        let styleBackcolor : string | number = this.Game.getVar('style_backcolor');

        if (typeof styleBackcolor === 'string') {
            this.style.backgroundColor = styleBackcolor;
        } else if (this.Game.getVar('style_backcolor') > 0) {
            let red = (styleBackcolor >> 16) & 0xFF;
            let green = (styleBackcolor >> 8) & 0xFF;
            let blue = styleBackcolor & 0xFF;

            this.style.backgroundColor = `rgb(${blue}, ${green}, ${red})`;
        }
    }

    /**
     * рендер
     */
    public render(): void {
        // костыли для <img> тега
        let text = this.Player.text;
        for (let i = 0; i < text.length; i++) {
            if (text[i].text !== undefined) {
                let regex = /(<img[^>]+src=")([^">]+)"/i;
                if (regex.test(text[i].text!)) {
                    let src = text[i].text!.match(regex);
                    if (src !== null) {
                        text[i].text = text[i].text!.replace(
                            /(<img[^>]+src=")([^">]+)"/gi,
                            '$1' + this.Game.resources[src[2]] + "\""
                        );

                    }
                }
            }
        }

        this.text = text;
        this.buttons = this.Player.buttons;
        this.setBackColor();
    }
}
