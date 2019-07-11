export interface LabelInterface {
    [key: string]: number
}

export default class Quest {
    get firstLabel(): string {
        return this._firstLabel;
    }
    protected _firstLabel: string = "";

    protected labels: LabelInterface = {};

    public useLabels: LabelInterface = {};

    protected quest: string[];

    constructor(text: string) {
        this.quest = text
            .replace(/^[\n\r]+|[\n\r]+$/g, "")
            .replace(/\/\*[\s\S.]+?\*\//g, "")
            .split(/[\n\r]+/);

        this.init();
    }

    protected init(): void {
        /**
         * Собираем метки
         */
        let label = "";

        for (let i = this.quest.length - 1; i >= 0; i--) {
            const line = this.get(i)!;

            if (line.startsWith("_") && line.substr(1, 1) !== "_") {
                this.quest[i - 1] = this.quest[i - 1] + line.substr(1);
                this.quest[i] = "";
            } else if (line.startsWith(":")) {
                label = line
                    .substr(1)
                    .toLowerCase()
                    .trim();

                if (line.toLowerCase().startsWith(":use_")) {
                    this.useLabels[label] = i;
                }

                this.labels[label] = i;
            }
        }

        this._firstLabel = label;
    }

    public getLabelPosition(label: string): number | null {
        label = label.toLowerCase();

        if (this.labels[label] === undefined) {
            return null;
        } else {
            return this.labels[label];
        }
    }

    /**
     * строка по номеру
     */
    public get(i: number): string | null {
        if (this.quest[i] === undefined) {
            return null;
        } else {
            return this.quest[i];
        }
    }
}
