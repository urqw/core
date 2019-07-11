import {LabelInterface} from "./Quest";

interface ItemActionsInterface {
    name?: string,
    id: string,
}

export interface ItemsInterface {
    [key: string]: ItemInterface
}

export interface ItemInterface {
    name: string,
    quantity: number,
    actions: ItemActionsInterface[]
}

export default class Inventory {
    public items: ItemsInterface = {};
    public useLabels: LabelInterface = {};

    constructor(useLabels: LabelInterface) {
        this.useLabels = useLabels;
    }

    public addItem(name: string, quantity: number): void {
        this.setItem(name, this.getItemQuantity(name) + quantity);
    }

    public removeItem(name: string, quantity: number): void {
        this.setItem(name, this.getItemQuantity(name) - quantity);
    }

    public setItem(name: string, quantity: number): void {
        if (quantity <= 0) {
            delete this.items[name.toLowerCase()];
        } else {
            if (this.items[name.toLowerCase()] === undefined) {
                this.items[name.toLowerCase()] = {
                    name: name,
                    quantity: quantity,
                    actions: this.getActions(name),
                };
            } else {
                this.items[name.toLowerCase()].quantity = quantity;
            }
        }
    }

    public getItemQuantity(name: string): number {
        if (this.items[name.toLowerCase()] === undefined) {
            return 0;
        }

        return this.items[name.toLowerCase()].quantity;
    }

    public getActions(itemName: string): ItemActionsInterface[] {
        const actions : ItemActionsInterface[] = [];

        for (let key in this.useLabels) {
            if ((itemName.toLowerCase() + '_' === key.substr(4, itemName.length + 1).toLowerCase())
                || (itemName.toLowerCase() == key.substr(4).toLowerCase())
            ) {
                const actionName = key.substr(itemName.length + 5);

                actions.push({
                    name: actionName,
                    id: key,
                });
            }
        }
        return actions;
    }
}