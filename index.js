const LOG_CONSOLE_ONLY = 0;
const LOG_COMMAND_ONLY = 1;
const LOG_ALL = 2;

const fs                        = require('fs');
const path                      = require('path');
const configJsonPath            = path.resolve(__dirname,'config.json');
const CORSAIRS_BG_ZONE          = 116
const LOCATION_CRYSTAL_BACK     = { x: 13131, y: 120654, z: 2150 }
const LOCATION_CRYSTAL_FRONT    = { x: 12878, y: 120365, z: 2150 }
const LOCATION_LEFT_CANNON      = { x: 12896, y: 120082, z: 2125 }
const LOCATION_RIGHT_CANNON     = { x: 12399, y: 120440, z: 2125 }
const LOCATION_INNER_GATE_BACK  = { x: 11811, y: 119358, z: 2150 }
const LOCATION_PYRE_NORTH       = { x: 11149, y: 113126, z: 1925 }
const LOCATION_PYRE_MID         = { x: 10228, y: 117796, z: 2700 }
const LOCATION_PYRE_SOUTH       = { x: 5338, y: 118544, z: 1900 }
const PYRE_MID_ID               = 1
const PYRE_NORTH_ID             = 2
const PYRE_SOUTH_ID             = 3
const TELEPORT_RANDOM_XY        = 50

module.exports = function CorsairMemes (dispatch) {
	const command = dispatch.command;
	let config = loadJson(configJsonPath);
	config.instantClimbThreshold = Math.min(99, Math.max(0, Math.floor(config.instantClimbThreshold))); // recommend setting this at or below 95 to avoid any funny behaviours/animations at the top of the ladder.
	let currentZone = -1;
	let myGameId = -1;
	let stopAtZ = undefined;
	let climbDestination = undefined;
	let climbingW = undefined;
	let blockClimbing = false;

	// :PepeThenk:
	command.add('csmemes', (arg1, arg2) => {
		if (arg1 != undefined){
			arg1 = arg1.toLowerCase();
		}
		else{
			logMessage(`Welcome to Corsair-memes!`)
			printGetHelp();
			return;
		}
		switch (arg1) {
			case 'instantclimb':
				if (arg2 != undefined && isNumber(arg2)){
					// Clamp the user-input between 0 and 99. :PepeGlare:
					config.instantClimbThreshold = Math.min(99, Math.max(0, Math.floor(arg2)));
				}
				else{
					config.instantClimb = !config.instantClimb;
				}
				logMessage(`Instant-ladder climbing is now ${config.instantClimb ? 'enabled' : 'disabled'}. Instant threshold of ${config.instantClimbThreshold}%.`);
				saveJson(config, configJsonPath);
				break;
			// Crystal room locations. :hue:
			case 'crystalback':
				teleport(LOCATION_CRYSTAL_BACK, TELEPORT_RANDOM_XY);
				break;
			case 'crystalfront':
				teleport(LOCATION_CRYSTAL_FRONT, TELEPORT_RANDOM_XY);
				break;
			case 'leftcannon':
				teleport(LOCATION_LEFT_CANNON, TELEPORT_RANDOM_XY);
				break;
			case 'rightcannon':
				teleport(LOCATION_RIGHT_CANNON, TELEPORT_RANDOM_XY);
				break;
			case 'innergate':
				teleport(LOCATION_INNER_GATE_BACK, TELEPORT_RANDOM_XY);
				break;
			// Various pyre locations.
			case 'northpyre':
				teleport(LOCATION_PYRE_NORTH, TELEPORT_RANDOM_XY);
				break;
			case 'midpyre':
				teleport(LOCATION_PYRE_MID, TELEPORT_RANDOM_XY);
				break;
			case 'southpyre':
				teleport(LOCATION_PYRE_SOUTH, TELEPORT_RANDOM_XY);
				break;
			// Who's a good boy? Definitely not you! :Evil:
			case 'capnorth':
				capPyre(PYRE_NORTH_ID, TELEPORT_RANDOM_XY);
				break;
			case 'capmid':
				capPyre(PYRE_MID_ID, TELEPORT_RANDOM_XY);
				break;
			case 'capsouth':
				capPyre(PYRE_SOUTH_ID, TELEPORT_RANDOM_XY);
				break;
			// QoL :)
			case 'help':
				printHelp();
				break;
			default:
				logMessage(`Invalid command.`);
				printGetHelp();
				break;
		}
	});


	// Get the current zone ID (so we know if/when we enter the battleground).
	dispatch.hook('S_LOAD_TOPO', 3, (event) => {
		currentZone = event.zone;
		if (event.zone == CORSAIRS_BG_ZONE) {
			logMessage(`Welcome to corsair-memes! Instant-climbing ladders is currently ${config.instantClimb ? 'enabled' : 'disabled'} with threshold of ${config.instantClimbThreshold}%.`);
		}
	});

	// Get our gameID.
	dispatch.hook('S_LOGIN', dispatch.majorPatchVersion >= 81 ? 13 : 12, (event) => {
		myGameId = event.gameId
	});

	// :PepeHappy:
	dispatch.hook('C_BROADCAST_CLIMBING', 1, (event) => {
		if (blockClimbing) {
			return false;
		}
		if (config.instantClimb && event.z >= stopAtZ) {
			// Server will reply S_INSTANT_MOVE (to the destination location) in return, which will move character to the top of the ladder in a standing free-to-move position.
			// Note: if instantClimbThreshold is set really high (97%-99%), your character will still perform a client-sided "getting up" animation - you can freely cast skills / jump at this point to break the animation.
			if (climbDestination == undefined){
				logMessage(`Undefined climbing destination. Abort instant-climb.`)
				return;
			}
			dispatch.toServer('C_END_CLIMBING', 2, {
				loc: climbDestination,
				w: climbingW
			});
			blockClimbing = true;
			setTimeout(clearBlockClimbing, 2000); // ~2 seconds should be fine for most people, this should be at least double the user's average ping.
		}
	});

	// :PepePoggers:
	dispatch.hook('S_START_CLIMBING', 1, (event) => {
		resetClimbingState();
		if (config.instantClimb && myGameId == event.gameId) {
			// Store the destination, angle, instant-threshold data for assessment when hooking C_BROADCAST_CLIMBING.
			climbDestination = event.dest;
			climbingW = event.w;
			stopAtZ = Math.floor(event.loc.z + ((event.dest.z - event.loc.z) * (config.instantClimbThreshold / 100)));
			logMessage(`Climb started! Instant-finishing at ${config.instantClimbThreshold}% up the ladder!`)
		}
	});

	// :PepeTired:
	dispatch.hook('C_END_CLIMBING', 2, (event) => {
		// Prevent the client from sending a naturally-generated C_END_CLIMBING packet, between the time it takes for the server to reply with S_INSTANT_MOVE after C_END_CLIMBING packet was crafted. 2x ping tax.
		// IMPORTANT: if however you still end up with a climbing animation because you set instantClimbThreshold configuration setting too close to 100 (anything above 95, really), then you will still be able
		// to jump & cast skills during the animation (which will break you out of the animation), but you will not be able to move normally using WASD keys until the animation ends (or you break it with a skill).
		if (blockClimbing){
			teleport(climbDestination, 0, false);
			return false;
		}
		else{
			// climbed back down.
			resetClimbingState();
		}
	});

	// :MonkaWorry:
	function clearBlockClimbing() {
		blockClimbing = false;
	}

	// :MonkaSleep:
	function resetClimbingState() {
		stopAtZ = undefined;
		climbDestination = undefined;
		climbingW = undefined;
	}

	// :MonkaStare:
	function capPyre(pyreId){
		// Not sure if anything bad would happen if you actually did though... :PepeShrug:
		if (currentZone != CORSAIRS_BG_ZONE){
			logMessage(`You may not cap pyres outside of Corsairs Stronghold!`)
			return;
		}
		logMessage(`Attempting to cap pyre ${pyreId}.`);
		dispatch.toServer('C_BATTLE_FIELD_START_OCCUPATION', 0, {
			id: pyreId
		})
	}

	// Now you see me... now you d... psst, over here!
	function teleport(newLocation, randomXY = 0, checkZone = true) {
		if (checkZone && currentZone != CORSAIRS_BG_ZONE){
			logMessage(`You are not in Corsairs Stronghold!`);
			return;
		}

		let modLoc = {};
		Object.assign(modLoc, newLocation);
		if (randomXY > 0){
			modLoc.x = getRandom(modLoc.x, randomXY);
			modLoc.y = getRandom(modLoc.y, randomXY);
		}
		// Leggo do the thing! The thing, i say! The thing!
		dispatch.toClient('S_INSTANT_MOVE', 3, {
			gameId: myGameId,
			loc: modLoc,
			w: 0
		});
	}

	// Smh
	function getRandom(base, variance){
		return base + (Math.random() * 2 * variance) - variance;
	}

	// Smhmh
	function isNumber(value) {
		return !isNaN(parseFloat(value)) && !isNaN(value - 0)
	}

	// :PepeZzZ:
	function printGetHelp() {
		logMessage(`For a descriptive list of commands: \n  - Type "csmemes help" (without the quotes) or, \n  - Refer to the README. \nThankyou for your co-operation.`)
	}

	// :PepeYawns:
	function printHelp() {
		let message;
		message += `Command list:`;
		message += `\n\t* csmemes instantclimb (toggle enable/disable instant climb)`;
		message += `\n\t* csmemes instantclimb [1-99] (set the instant-climb threshold)`;
		message += `\n\t* csmemes crystalback (Teleport behind the anchorstone)`;
		message += `\n\t* csmemes crystalfront (Teleport in front of the anchorstone)`;
		message += `\n\t* csmemes leftcannon (Teleport beside the left cannon by the anchorstone)`;
		message += `\n\t* csmemes rightcannon (Teleport beside the right cannon by the anchorstone)`;
		message += `\n\t* csmemes capnorth (Cap the North pyre from anywhere on the map)`;
		message += `\n\t* csmemes capmid (Cap the Middle pyre from anywhere on the map)`;
		message += `\n\t* csmemes capsouth (Cap the South pyre from anywhere on the map)`;
		message += `\n\t* csmemes northpyre (Teleport beside the North Pyre)`;
		message += `\n\t* csmemes midpyre (Teleport beside the Middle Pyre)`;
		message += `\n\t* csmemes southpyre (Teleport beside the South Pyre)`;
		logMessage(message);
	}

	function loadJson(filePath){
		try {
			let data = JSON.parse(fs.readFileSync(filePath, "utf8"));
			if (!data){
				logMessage(`Error loading JSON at ${filePath}`, LOG_CONSOLE_ONLY)
			}
			else{
				logMessage(`Loaded data from JSON at ${filePath}`, LOG_CONSOLE_ONLY)
			}
			return data ? data : {};
		}
		catch (err) {
			logMessage(`Error loading JSON at ${filePath}!`, LOG_CONSOLE_ONLY)
			return {}
		}
	}

	function saveJson(data, path) {
		fs.writeFile(path, JSON.stringify(data, null, '\t'), 'utf8', function (err) {
			if (!err){
				logMessage(`The JSON at ${path} has been successfully updated.`, LOG_CONSOLE_ONLY)
			}
			else{
				logMessage(`Error writing to ${path}!`, LOG_CONSOLE_ONLY)
			}
		});
	}

	// What do we want? Logs! Where do we want them? Everywhere!
	function logMessage(message, logState = LOG_COMMAND_ONLY){
		switch(logState){
			case LOG_COMMAND_ONLY:
				command.message(message);
				break;
			case LOG_CONSOLE_ONLY:
				console.log(message);
				break;
			case LOG_ALL:
				command.message(message);
				console.log(message);
				break;
			default:
				console.log(message);
				break;
		}
	}
}
