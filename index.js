// NOTE: Currently ignores all air however if the structure was to be placed near another it might not get rid of the excess - (TLDR: It won't destroy blocks even if air is meant to be there) 
const { GoalGetToBlock, GoalNear } = require('mineflayer-pathfinder').goals;
const { pathfinder } = require('mineflayer-pathfinder');
const mineflayer = require('mineflayer');
const Vec3 = require('vec3');

const utils = require('./utils.js');

const TEST_LITEMATIC = "test_files/litematic/25423.litematic";
const TEST_SCHEM = "test_files/schem/smallhouse.schem";
const TEST_SCHEMATIC = "test_files/schematic/viking-house.schematic";
const TEST_SPONGE_SCHEM = "test.schem";


var to_do = [];
var shopping_list = [];

var paused = true;

var chosen_schematic = '';
var schematic = null;

var starting_pos = new Vec3(0, 0, 0);


const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'BuilderBot',
  version: '1.20.6' // Change according to your server
});

bot.loadPlugin(pathfinder);
utils.init(bot)

bot.once('spawn', async () => {
    // bot.chat("Hello motherF%^&*9!");
    bot.chat("/tp 0 -60 0");
    updateLoop()
    starting_pos = bot.entity.position
});

bot.on('chat', async (username, message) => {
    console.log(`${username}: ${message}`);

    if (username == bot.username) {return};

    // Handling custom commands
    if (message.startsWith(":") == false) {
        return;
    }

    s = message.split(" ");
    head = s[0];
    args = s.slice(1);
    console.log(`Command: '${head}', args: ${args}`);

    try {
        
        switch (head) {
            case ':start':
                paused = false;
                
                schematic = await utils.read_schem(chosen_schematic);
                [ schematic, to_do, shopping_list ] = await utils.setup_schematic(schematic)
                
                break;
            
            case ':set_schem':
                chosen_schematic = args.join(' ');
                if (!utils.file_exists(chosen_schematic)) {
                    bot.emit("setup_error", "Specified schematic file does not exist!")
                    break;
                }
                schematic = await utils.read_schem(chosen_schematic);
                [ schematic, to_do, shopping_list ] = await utils.setup_schematic(schematic)
                
                console.log(`Set schematic to: ${chosen_schematic}`);
                
                break;

            case ':set_pos_rel':
                starting_pos = bot.entity.position
                starting_pos = new Vec3(Math.round(starting_pos.x), Math.round(starting_pos.y), Math.round(starting_pos.z))

                console.log(`Set pos to: ${starting_pos}`)
                break;
                
            case ':set_pos':
                starting_pos = new Vec3(parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]))
                starting_pos = new Vec3(Math.round(starting_pos.x), Math.round(starting_pos.y), Math.round(starting_pos.z))
                console.log(`Set pos to: ${starting_pos}`)
                break;

            case ':info':
                bot.chat(`Schematic: ${chosen_schematic}`);
                bot.chat(`Paused: ${paused}`);
                bot.chat(`To do: ${to_do.length}`);
                break;

            case ':shopping':
                if (shopping_list.length == 0) {
                    bot.chat("No shopping!.. That's odd...")
                }
                shopping_list.forEach((item) => {
                    bot.chat(`- ${item}`)
                })
                break;
            
            case ':pause':
                paused = true;
                break;
            
            case ':stop':
                bot.pathfinder.stop();
                chosen_schematic = "";
                paused = true;
                to_do = [];
                break;

            case ':make_with_commands':
                console.log("MAKING...")
                var commands = await schematic.makeWithCommands(starting_pos);
                commands.forEach((c) => {
                    console.log("Running:", c)
                    bot.chat(c)
                    utils.wait(100)
                })
                bot.emit("complete_build")
                break;
        }
 
    } catch (error) {
        bot.emit('setup_error', error)
    }
})

async function updateLoop() {
    
    starting_pos = Vec3(Math.round(starting_pos.x), Math.round(starting_pos.y), Math.round(starting_pos.z))

    // Don't allow updateLoop to re-run if bot no longer exists
    if (bot._client.ended) { 
        console.log(`Bot has ended! Exiting updateLoop!`); 
        return; 
    } 

    if (paused || schematic == null) {
        setTimeout(updateLoop, 1000)
        return
    };

    if (to_do.length == 0) {
        console.log("Complete!")
        bot.emit("build_complete")
        paused = true;
        setTimeout(updateLoop, 100);
        return;
    }

    // while (!bot.entity.onGround) {
        // await wait(100);
    // }

    var block = to_do.pop()  

    if (block) {
        var pos = block.position.offset(starting_pos.x, starting_pos.y, starting_pos.z)
        
        console.log(block.name, pos)

        // TODO: move bot
        // TODO: destroy any existing block
        // TODO: place block

        bot.emit("build_progress")
    }


    setTimeout(updateLoop, 100)
}


// Normal errors
bot.on('error', (err) => console.log(err))
bot.on('kicked', (reason) => console.log(reason))
bot.on('end', (reason) => console.log(reason))

// Errors that happened when the player was using the custom commands
bot.on('setup_error', (err) => {
    console.log(`Error from player setting up: ${err}`)
    bot.chat(`There was an error: ${err}`)
})
// Errors that happened while building
bot.on('build_error', (err) => console.log(`Error while building: ${err}`))

// Other custom emits
bot.on("build_complete", () => {
    console.log("Build complete!")
    bot.chat("Build complete!")
    paused = true;
})

bot.on("build_progress", async () => {
    var total_blocks = await utils.number_of_blocks(schematic, false)
    var completed = total_blocks - to_do.length
    console.log(`Progress: ${completed} / ${total_blocks}`)
})