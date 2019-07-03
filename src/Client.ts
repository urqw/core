import Player, {status, SavedGameInterface, ContentInterface, ButtonInterface} from "./Player";
import Game, {ResourceInterface} from "./Game";

export default class Client {
    public static gameMusic = new Audio();
    public static volume: number = 1;

    /**
     * проигрыватель
     */
    protected player: Player;
    /**
     * инстанс игры
     */
    protected game: Game;

    protected text: ContentInterface[] = [];

    protected buttons: ButtonInterface[] = [];

    protected style: { backgroundColor: string, textColor: string } = {
        backgroundColor: '',
        textColor: '',
    };

    constructor(GameInstance: Game) {
        this.game = GameInstance;
        this.player = new Player(this.game, this);
        this.player.continue()
    }

    /**
     * инстанс новой игры
     */
    public static createGame(questname: string, quest: string, resources: ResourceInterface, mode: string = "urqw"): Client {
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
    public inputDone(text: string) {
        if (this.isStatusInput()) {
            return this.player.inputAction(text);
        }

        return false;
    }


    public isStatusInput(): boolean {
        return this.player.getStatus() === status.INPUT;
    }

    public isStatusAnykey(): boolean {
        return this.player.getStatus() === status.ANYKEY;
    }

    public getVolume(): number {
        return Client.volume;
    }

    public setVolume(volume: number): void {
        Client.volume = volume;
        Client.gameMusic.volume = Client.volume;
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

    public restartGame(): Client | null {
        if (this.player.getStatus() === status.NEXT) {
            return null;
        }

        this.player.restart();

        return new Client(this.game);
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

    public static removeLinks(text: ContentInterface[]): ContentInterface[] {
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
        let styleBackcolor : string | number = this.game.getVar('style_backcolor');

        if (typeof styleBackcolor === 'string') {
            this.style.backgroundColor = styleBackcolor;
        } else if (this.game.getVar('style_backcolor') > 0) {
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

        this.text = text;
        this.buttons = this.player.buttons;
        this.setBackColor();
    }
}
