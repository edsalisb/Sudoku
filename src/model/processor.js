const _ = require('lodash')
const rules = require('./rules');

//checks
const checks = rules.checks;
const checkAdvancedMoves = checks.checkAdvancedMoves;
const checkBoard = checks.checkBoard;

const validators = rules.validators;
const POSSIBLE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

class Processor {
    constructor() {
        this.iterationCheck = 0;
        this.depth = 1;
        this.depthsAchieved = [];
        this.solved = false;
        this.start = Date.now();
    }

    beginSolve(ctx) {
        this.depth++;
        if (this.depthsAchieved.indexOf(this.depth) === -1) {
            console.log(`Process: ${process.pid} Depth: ${this.depth}, ${Date.now() - this.start} ms`)
            this.depthsAchieved.push(this.depth);
        }
        let boardClone = _.cloneDeep(ctx);
        let availableMoveHash = this.determineMoveHash(boardClone);
        let availableMoves = Object.keys(availableMoveHash);

        //second step: compare available moves against the checks

        if (availableMoves.length > 0) {
            availableMoves.sort((a, b) => {
                if (availableMoveHash[a].num < availableMoveHash[b].num) return -1;
                if (availableMoveHash[a].num > availableMoveHash[b].num) return 1;
                return 0;
            })

            for (let i = 0; i < availableMoves.length; i++) {
                const availableMove = availableMoves[i];

                const { y, x } = this.deconstructKey(availableMove);
                const test = availableMoveHash[availableMove];
                for (let j = 0; j < test.moves.length; j++) {
                    if (this.depth === 1) console.log(`${new Date().toISOString()} --`, 'context', 'Aavilable move: ' + i, 'test moves iteration number ' + j, 'depth number 1')
                    this.iterationCheck++;
                    if (this.iterationCheck % 10000 === 0) console.log(`${new Date().toISOString()} iterationCount ${this.iterationCheck} -- depth: ${this.depth}`)
                    let move = test.moves[j];
                    try {
                        boardClone[y][x] = test.moves[j];
                        if (checks.checkBoard(boardClone, true)){
                            let whatIs = this.beginSolve(boardClone);
                            return whatIs;
                        }
                        else{
                            boardClone[y][x] = 0;
                            continue;
                        }
                        
                    }
                    catch (e) {
                        this.depth--;
                        boardClone[y][x] = 0;
                        continue;
                    }
                }
            }
        }
        let result = checks.checkBoard(boardClone);
        if (!result) {
            throw new Error('BOARD IS NOT VALID');
        }
        else {
            return boardClone;
        }
    }

    determineMoveHash(ctx) {
        let availableMoves = [];
        let availableMoveHash = {};
        do {
            if (availableMoves.length > 0) {
                this.solveForCertainties(ctx, availableMoveHash);
            }
            for (let y = 0; y < ctx.length; y++) {
                const row = ctx[y];
                for (let x = 0; x < row.length; x++) {
                    const cell = row[x];


                    if (cell === 0) {
                        let allowedValues = ruleChecks(ctx, { x, y });
                        if (allowedValues.length > 0) {
                            availableMoveHash[`${y}-${x}`] = {
                                num: allowedValues.length,
                                moves: allowedValues
                            };
                        }
                        else {
                            throw new Error('No moves found')
                        }
                    }

                }
            }
            availableMoveHash = checkAdvancedMoves(ctx, availableMoveHash);
            availableMoves = Object.keys(availableMoveHash);
        }
        while (availableMoves.filter(key => availableMoveHash[key].num === 1).length > 0);
        return availableMoveHash;
    }

    deconstructMoveHash(hash) {
        let returnVal = [];
        Object.keys(hash).forEach(key => {
            let moves = hash[key].moves;
            moves.forEach(move => {
                returnVal.push({
                    coords: key,
                    move
                })
            })
        });
        return returnVal;
    }
    deconstructKey(key) {
        let split = key.split('-');
        return {
            y: Number(split[0]),
            x: Number(split[1])
        };
    }

    solveForCertainties(ctx, hash){
        Object.keys(hash).forEach(key => {
            let val = hash[key];
            if (val && val.num === 1) {
                let { x, y } = this.deconstructKey(key);
                ctx[y][x] = val.moves[0];
                delete hash[key];
            }
        })
    }
}

function ruleChecks(ctx, opts) {
    let returnVals = [];
    if (opts.attemptedVal && opts.attemptedVal > 9) {
        return returnVals;
    }
    for (let i = 0; i < POSSIBLE_VALUES.length; i++) {
        const attemptedVal = POSSIBLE_VALUES[i];
        let ruleOpts = {
            ...opts,
            attemptedVal
        };
        let allowed = true;
        for (let j = 0; j < validators.length; j++) {
            const rule = validators[j];
            const result = rule(ctx, ruleOpts);
            if (!result) {
                allowed = false;
                break;
            }

        }
        if (allowed) {
            returnVals.push(attemptedVal);
        }
    }
    return returnVals;
}

module.exports = new Processor;