export type ArchnemesisMods = "Sentinel"


const ArchnemesisInventorySize = 64;

export const Recipes: { [key: string]: string[] } = {
    "Innocence-touched": ["Lunaris-touched", "Solaris-touched", "Mirror Image", "Mana Siphoner"],
    "Lunaris-touched": ["Invulnerable", "Frost Strider", "Empowering Minions"],
    "Invulnerable": ["Sentinel", "Juggernaut", "Consecrator"],
    "Frost Strider": ["Frostweaver", "Hasted"],
    "Empowering Minions": ["Necromancer", "Executioner", "Gargantuan"],
    "Necromancer": ["Bombardier", "Overcharged"],
    "Executioner": ["Frenzied", "Berserker"],
    "Solaris-touched": ["Invulnerable", "Magma Barrier", "Empowering Minions"],
    "Magma Barrier": ["Incendiary", "Bonebreaker"],
    "Mirror Image": ["Echoist", "Soul Conduit"],
    "Mana Siphoner": ["Consecrator", "Dynamo"],
    "Tukohama-touched": ["Bonebreaker", "Executioner", "Magma Barrier"],
    "Abberath-touched":["Flame Strider", "Fenzied", "Rejuvenating"],
    "Rejuvenating": ["Gargantuan", "Vampiric"],
    "Flame Strider": ["Flameweaver", "Hasted"],
    "Brine King-touched": ["Ice Prison", "Storm Strider", "Heralding Minions"],
    "Ice Prison": ["Permafrost", "Sentinel"],
    "Storm Strider": ["Stormweaver", "Hasted"],
    "Heralding Minions": ["Dynamo", "Arcane Buffer"],
    "Treant Horder": ["Toxic", "Sentinel", "Steel-infused"],
    "Money Money Money": ["Innocence-touched", "Abberath-touched", "Treant Horder", "Brine King-touched"]
}

export const RecipeGoal = ["Money Money Money", "Money Money Money", "Money Money Money"]


export function LeafNodes() {
    /**
     * Find the leaf nodes of the Recipes Tree.
     */
    const lists = Object.values(Recipes).flat();
    const ingredients = Array.from(new Set<string>(lists));
    const leafNodes = ingredients.filter(ingredient => typeof Recipes[ingredient] === "undefined");
    return leafNodes.sort();
}

export function RecipeNodes() {
    /**
     * Find the leaf nodes of the Recipes Tree.
     */
    const lists = Object.values(Recipes).flat();
    const ingredients = Array.from(new Set<string>(lists));
    const leafNodes = ingredients.filter(ingredient => typeof Recipes[ingredient] !== "undefined");
    leafNodes.push(...Array.from(new Set(RecipeGoal)));
    return leafNodes.sort();
}


export function RequiredItems() {
    const totalItemsNeeded: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    for (const goal of RecipeGoal) {
        totalItemsNeeded.push(goal);
        const itemsNeeded = RequiredItemsFor(goal);
        totalItemsNeeded.push(...itemsNeeded);
    }
    return summarizeList(totalItemsNeeded);
}

export function RequiredItemsFor(goal: string) {
    const itemsNeeded: string[] = [];
    const items = Recipes[goal];
    if (items) {
        for (const item of items) {
            itemsNeeded.push(item);
            const itemsNeededForItem = RequiredItemsFor(item);
            itemsNeeded.push(...itemsNeededForItem);
        }
    }
    console.log(`${goal} requires ${itemsNeeded.length} items`);
    return itemsNeeded;
}

export function summarizeList(items: string[]) {
    const summary = items.reduce((acc, item) => {
        if (item in acc) {
            acc[item]++;
        } else {
            acc[item] = 1;
        }
        return acc;
    }, {} as { [key: string]: number });
    return summary;
}

export function ComputeNeeded(inventorySummary: { [mod: string]: number }): { [mod: string]: number } {
    const itemsNeeded: string[] = [];
    const inventoryTrack = {...inventorySummary};
    for (const goal of RecipeGoal) {
        if ((inventoryTrack[goal] ?? 0) === 0) {
            itemsNeeded.push(goal);
            const itemsNeededForGoal = ComputeNeededFor(goal, inventoryTrack);
            itemsNeeded.push(...itemsNeededForGoal);
        } else {
            inventoryTrack[goal]--;
        }
    }
    return summarizeList(itemsNeeded);
}

export function ComputeNeededFor(goal: string, inventorySummary: { [mod: string]: number }): string[] {
    const itemsNeeded: string[] = [];
    const items = Recipes[goal];
    if (items) {
        for (const item of items) {
            if ((inventorySummary[item] ?? 0) === 0) {
                itemsNeeded.push(item);
                const itemsNeededForItem = ComputeNeededFor(item, inventorySummary);
                itemsNeeded.push(...itemsNeededForItem);
            } else {
                inventorySummary[item]--;
            }
        }
    }
    return itemsNeeded;
}


export function calculateReadyRecipes(inventorySummary: { [mod: string]: number }) {
    const needed = ComputeNeeded(inventorySummary);
    const neededRecipes = Object.keys(needed).filter(key => typeof Recipes[key] !== "undefined");
    const readyRecipes = neededRecipes.filter(key => HasInventory(key, inventorySummary));
    return readyRecipes;
}

export function HasInventory(recipe: string, inventory: { [mod: string]: number }) {
    const items = Recipes[recipe];
    if (items) {
        for (const item of items) {
            if ((inventory[item] ?? 0) === 0) {
                return false;
            }
        }
    }
    return true;
}