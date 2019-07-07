
export interface MediaClientInterface {
    gameMusic : HTMLAudioElement;

    getVolume(): number;

    setVolume(volume: number): void;

    getNewSound(src: string): HTMLAudioElement;
}
