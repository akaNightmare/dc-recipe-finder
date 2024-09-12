export function estimateZippedCountWithMerging(
    ingredientIds: string[][],
    ingredientsCount: number,
): number {
    let zipped = 0;
    let currentSet = new Set(ingredientIds.shift());

    while (ingredientIds.length > 0) {
        let iteration = 0;

        while (currentSet.size < ingredientsCount && iteration < ingredientIds.length) {
            const nextSet = new Set(ingredientIds[iteration]);

            // If there's an intersection, merge the sets
            if (hasIntersection(currentSet, nextSet)) {
                mixSet(currentSet, nextSet); // Custom merge function
                ingredientIds.splice(iteration, 1); // Remove the merged set

                if (currentSet.size === ingredientsCount) {
                    zipped++;
                    currentSet = new Set(ingredientIds.shift()); // Start a new set
                    iteration = 0;
                }
            } else {
                iteration++;
            }
        }

        // Handle the case where the set isn't fully zipped
        if (currentSet.size !== ingredientsCount && ingredientIds.length > 0) {
            currentSet = new Set(ingredientIds.shift());
        }
    }

    return zipped;
}

export const factorize = (num: number): number => {
    if (num === 0 || num === 1) {
        return 1;
    }

    let result = num;
    while (num > 1) {
        result *= --num;
    }

    return result;
};

// Math formula: C(n, r) = n!/r!(n–r)!
export const combination = (n: number, r: number): number =>
    factorize(n) / (factorize(r) * factorize(n - r));

export function combinationN<T>(list: T[], n: number): T[][] {
    const result: T[][] = [];

    if (n === 1) {
        return list.map(item => [item]);
    }

    for (let i = 0; i <= list.length - n; i++) {
        const subCombinations = combinationN(list.slice(i + 1), n - 1);

        for (const combo of subCombinations) {
            result.push([list[i], ...combo]);
        }
    }

    return result;
}

function hasIntersection(setA: Set<string>, setB: Set<string>): boolean {
    for (const elem of setB) {
        if (setA.has(elem)) return true;
    }
    return false;
}

function mixSet(setA: Set<string>, setB: Set<string>): void {
    for (const elem of setB) {
        setA.add(elem);
    }
}
