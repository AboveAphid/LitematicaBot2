const { Schematic } = require('prismarine-schematic');
const fs = require('fs');
const fsPromises = require('fs').promises;
const Bot = require('mineflayer').mineflayer;
const Vec3 = require('vec3');

var version;

/**
 * ### MUST BE RUN BEFORE ALL OTHER UTILS FUNCTIONS!
 * @param {Bot} bot - Mineflayer bot
 */
async function init(bot) {
    version = bot.version;
}

function file_exists(path) {
    return fs.existsSync(path)
}

/**
 * @param {string} path - File path to schematic/schem file
 */
async function read_schem(path) {
    var schem = await Schematic.read(await fsPromises.readFile(path))
    return schem
}

/**
 * @param {Schematic} schematic - File path to schematic/schem file
*/
async function to_sponge (schematic) {
    // Write a schematic (sponge format)
    await fsPromises.writeFile('test.schem', await schematic.write())
}

/**
 * @param {Schematic} schematic - File path to schematic/schem file
 * @param {boolean} include_air - Should include air blocks in total count
*/
async function number_of_blocks(schematic, include_air) {
    // Count if we are not including air
    var number_of_blocks = 0;
    await schematic.forEach((block, pos) => {
        if (block.name === 'air' && !include_air) return;
        number_of_blocks++;
    })
    return number_of_blocks
}

/**
 * @param {number} ms - Number of milliseconds to wait
 */
async function wait (ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {Schematic} schematic - Schematic to build
 */
async function setup_schematic (schematic) {
    const Block = require('prismarine-block')(version);

    var shopping_list = []
    var to_do_list = []

    for (const stateId of schematic.palette || []) {
    
        var block = Block.fromStateId(stateId, 0)

        if (block.name == 'air') continue;
        
        if (!shopping_list.includes(block.name)) {
            shopping_list.push(block.name)
        }
    }
    shopping_list = shopping_list.sort() // Sort in alphabetical order instead of StateID

    await schematic.forEach((block, pos) => {
        if (block.name === 'air') return;
        block.position = pos // Add missing pos
        to_do_list.push(block)
    })
    return [schematic, to_do_list, shopping_list];
}


module.exports = {
    init,
    read_schem,
    to_sponge,
    wait,
    setup_schematic,
    number_of_blocks,
    file_exists
};