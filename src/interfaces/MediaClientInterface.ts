
export interface MediaClientInterface {
    gameMusic : HTMLAudioElement;

    getVolume(): number;

    setVolume(volume: number): void;

    music(src: string): void;

    sound(src: string): void;
}
