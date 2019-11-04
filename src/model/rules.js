const _ = require('lodash')

const validators = [
    withinSquare,
    horizontalCheck,
    verticalCheck
];
const checks = {
    checkBoard,
    checkAdvancedMoves

};
const bounds = [
    [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 2, y: 0 },
        { x: 2, y: 2 }
    ],
    [
        { x: 0, y: 3 },
        { x: 0, y: 5 },
        { x: 2, y: 3 },
        { x: 2, y: 5 }
    ],
    [
        { x: 0, y: 6 },
        { x: 0, y: 8 },
        { x: 2, y: 6 },
        { x: 2, y: 8 }
    ],
    [
        { x: 3, y: 0 },
        { x: 3, y: 2 },
        { x: 5, y: 0 },
        { x: 5, y: 2 }
    ],
    [
        { x: 3, y: 3 },
        { x: 3, y: 5 },
        { x: 5, y: 3 },
        { x: 5, y: 5 }
    ],
    [
        { x: 3, y: 6 },
        { x: 3, y: 8 },
        { x: 5, y: 6 },
        { x: 5, y: 8 }
    ],
    [
        { x: 6, y: 0 },
        { x: 6, y: 2 },
        { x: 8, y: 0 },
        { x: 8, y: 2 }
    ],
    [
        { x: 6, y: 3 },
        { x: 6, y: 5 },
        { x: 8, y: 3 },
        { x: 8, y: 5 }
    ],
    [
        { x: 6, y: 6 },
        { x: 6, y: 8 },
        { x: 8, y: 6 },
        { x: 8, y: 8 }
    ],
]
function withinSquare(ctx, opt) {
    const bound = bounds.find(bound => {
        bound.sort((a, b) => sortBy(a, b, 'x'))
        let xValid = bound[0].x <= opt.x && bound[2].x >= opt.x;

        bound.sort((a, b) => sortBy(a, b, 'y'));
        let yValid = bound[0].y <= opt.y && bound[2].y >= opt.y;

        return xValid && yValid;
    });

    if (!bound) return false;

    let forBounds = getBoundary(bound);

    for (let y = forBounds.minY; y <= forBounds.maxY; y++) {
        const row = ctx[y];
        for (let x = forBounds.minX; x <= forBounds.maxX; x++) {
            let col = row[x];
            if (col === opt.attemptedVal) {
                return false;
            }
        }
    }
    return true;
}

function horizontalCheck(ctx, opt) {
    const row = ctx[opt.y];
    const dupeFound = row.find(col => opt.attemptedVal === col);

    return dupeFound ? false : true;
}

function verticalCheck(ctx, opt) {
    let col = ctx.map(row => row[opt.x]);
    const dupeFound = col.find(row => opt.attemptedVal === row);
    return dupeFound ? false : true;
}

function checkBoard(ctx, partial) {
    let checks = [];
    for (let b = 0; b < bounds.length; b++) {
        const bound = bounds[b];
        const forBounds = getBoundary(bound);
        let check = [];
        for (let y = forBounds.minY; y <= forBounds.maxY; y++) {
            const row = ctx[y];
            for (let x = forBounds.minX; x <= forBounds.maxX; x++) {
                let col = row[x];
                check.push(col);
            }
        }
        checks.push(check)
    }

    for (let i = 0; i < ctx.length; i++) {
        checks.push(ctx.map(row => row[i]));
        checks.push(ctx[i]);
    }


    for (let i = 0; i < checks.length; i++) {
        const check = checks[i];
        
        if (partial){
            // only checking for distinct numbers greater than 0
            let distinctNums = [];
            for (let j = 0; j < check.length; j++){
                let val = check[j];
                if (val > 0){
                    if (distinctNums.indexOf(val) === -1){
                        distinctNums.push(val);
                    }
                    else{
                        // console.log('CHECK NUM', check)
                        return false;
                    }
                }
            }
        }
        else{
            // full distinct check
            let unique = check.filter((value, index, self) => {
                return self.indexOf(value) === index;
            });
            
            if (unique.length !== 9) {
                return false;
            }
        }
        
    }
    return true;
}

function getMoveObject(moves, key) {
    const cell = `${key.y}-${key.x}`
    return {
        moves: moves[cell].moves,
        cell
    }

}

function checkAdvancedMoves(ctx, moves) {
    let moveSets = [];
    let objectKeys = Object.keys(moves).map(key => {
        let keySplit = key.split('-');
        return {
            y: Number(keySplit[0]),
            x: Number(keySplit[1])
        };
    });

    // add all on same row and column
    for (let i = 0; i < 9; i++) {
        moveSets.push(objectKeys.filter(key => key.y === i).map((key) => getMoveObject(moves, key)))
        moveSets.push(objectKeys.filter(key => key.x === i).map((key) => getMoveObject(moves, key)))
    }

    bounds.forEach(bound => {
        let moveSet = [];
        let boundary = getBoundary(bound);
        for (let y = boundary.minY; y <= boundary.maxY; y++) {
            const row = ctx[y];
            for (let x = boundary.minX; x <= boundary.maxX; x++) {
                const cell = `${y}-${x}`
                if (moves[cell]) {
                    moveSet.push({ cell, moves: moves[cell].moves });
                }
            }
        }
        moveSets.push(moveSet);
    })

    for (let i = 0; i < 2; i++) {

        for (let i = 0; i < moveSets.length; i++) {
            evaluateMoveSet(moves, moveSets[i])
        }
    }

    return _.cloneDeep(moves)
}

function evaluateMoveSet(moveHash, moveSet) {
    let distinctNums = [];
    let returnVal = false;
    // get distinct numbers across all moves
    for (let i = 0; i < moveSet.length; i++) {
        let justMove = moveSet[i].moves;
        for (let j = 0; j < justMove.length; j++) {
            if (distinctNums.indexOf(justMove[j]) === -1) {
                distinctNums.push(justMove[j]);
            }
        }
    }

    let combinations = getCombinations(distinctNums);
    combinations.forEach(combination => {
        let squaresRequired = combination.length;
        let squaresToDelete = [];
        const intersectionCount = moveSet.filter(set => {
            let moves = set.moves;
            if (moves.length < squaresRequired) return false;

            let test = moves.filter(move => -1 !== combination.indexOf(move));
            let filterCheck = test.length === moves.length;
            if (!filterCheck) squaresToDelete.push(set);
            return test.length === moves.length
        })

        if (squaresRequired === intersectionCount.length) {
            returnVal = true;
            squaresToDelete.forEach(square => {
                const cell = square.cell;
                let moves = moveHash[cell];
                moveHash[cell].moves = moveHash[cell].moves.filter(move => {
                    return -1 === combination.indexOf(move)
                });
                moveHash[cell].num = moveHash[cell].moves.length;
                // delete 
            })
        }
    });
    return returnVal;
}

function getCombinations(distinctNumbers) {
    let result = [];
    const fn = (x, nums) => {
        for (let i = 0; i < nums.length; i++) {
            const num = nums[i];
            let newCombination = [...x, num];
            // we don't need single number combinations
            if (newCombination.length > 1) {
                result.push(newCombination);
            }

            fn(newCombination, nums.slice(i + 1));
        }
    }
    fn([], distinctNumbers);
    return result;
}

function getBoundary(bound) {
    let onlyX = bound.map(val => val.x);
    let onlyY = bound.map(val => val.y);

    let minX = Math.min(...onlyX);
    let maxX = Math.max(...onlyX);

    let minY = Math.min(...onlyY);
    let maxY = Math.max(...onlyY);

    return {
        minX,
        maxX,
        minY,
        maxY
    }
}

const sortBy = (obj, obj2, prop) => {
    if (obj[prop] < obj2[prop]) {
        return -1
    }
    else if (obj[prop] > obj2[prop]) {
        return 1;
    }
    return 0;
}

module.exports = {
    validators: validators,
    checks,
    getBoundary,
}