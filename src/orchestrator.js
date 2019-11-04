const processor = require('./model/processor');
const cores = require('os').cpus().length;
const cluster = require('cluster');
const _ = require('lodash');

const POSSIBLE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let board = [
    [1, 3, 0, 0, 8, 0, 7, 0, 0],
    [0, 8, 0, 6, 0, 0, 0, 0, 0],
    [0, 5, 0, 0, 0, 4, 0, 0, 0],

    [4, 0, 0, 0, 5, 0, 0, 0, 0],
    [2, 0, 1, 0, 0, 0, 8, 0, 9],
    [0, 0, 0, 0, 6, 0, 0, 0, 3],

    [0, 0, 0, 1, 0, 0, 0, 6, 0],
    [0, 0, 0, 0, 0, 9, 0, 4, 0],
    [0, 0, 8, 0, 2, 0, 0, 3, 1]
];




let index = 0;
let deconstructedHash;
let puzzleSolved = false;
if (cluster.isMaster) {
    let rootState = _.cloneDeep(board);
    let moveHash = processor.determineMoveHash(rootState);
    const keyList = Object.keys(moveHash);

    // if the movehash was solved in one pass
    if (keyList.length === 0) {
        console.log('solved', board);
        process.exit();
    }
    // orchestration
    else {



        deconstructedHash = processor.deconstructMoveHash(moveHash)
        console.log('HASH LENGTH', deconstructedHash.length);

        for (let i = 0; i < cores; i++) {
            let moveObject = deconstructedHash[index];
            let newBoard = _.cloneDeep(rootState)
            initThread(newBoard, moveObject)

            index++;
        }


        wait();

        cluster.on('exit', (worker) => {
            index++;
            console.log('Executing on move', index)
            let newBoard = _.cloneDeep(rootState);
            initThread(newBoard, deconstructedHash[index])
        })
        
        cluster.on('message', (worker, message) => {
            puzzleSolved = true;
            for (var id in cluster.workers){
                cluster.workers[id].kill();
            }
            process.exit(0);
        })
    }

}
// WORKER THREAD
else {
    let solved;

    try {
        let boardClone = JSON.parse(process.env.CTX)
        solved = processor.beginSolve(boardClone);
        console.log('SOLVED', solved)
        process.send({cmd: 'solved'})
    }
    catch (e) {
        console.log('err', e.message)
        process.exit();
    }
}


function wait() {
    if (!puzzleSolved){
        setTimeout(wait, 500)
    }
    
}

function initThread(ctx, moveObject) {
    if (!moveObject) return;

    let coords = processor.deconstructKey(moveObject.coords)
    ctx[coords.y][coords.x] = moveObject.move;
    cluster.fork({
        CTX: JSON.stringify(ctx)
    })
}


