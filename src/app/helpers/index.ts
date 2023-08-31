export const factorialize = (num: number): number => {
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
export const combination = (n: number, r: number): number => factorialize(n) / (factorialize(r) * factorialize(n - r));

export function* combinationN<T>(list: T[], n: number): Generator<T[]> {
    if (n === 1) {
        for (const a of list) {
            yield [a];
        }
        return;
    }

    for (let i = 0; i <= list.length - n; i++) {
        for (const c of combinationN(list.slice(i + 1), n - 1)) {
            yield [list[i], ...c];
        }
    }
}
