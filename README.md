# Corsair-Memes

By: Cattalol

This Tera-Toolbox / Tera-Proxy QoL module allows you to:
- Instantly finish ladder climbing (without a locked animation at the end), upon reaching the configured percentage (e.g. 90% up the ladder).
- Teleport to various locations within the defending crystal room with a single command.
- Magically capture pyres from anywhere on the map (functionally a "battleground capper").
  - If you do not wish for your capture score to be excessively high, halt the capture action when the pyre is almost captured (points are only awarded on full capture of the pyre).

You (as the user of this content) are solely responsible for your own actions and any consequences resulting from them.

## Proxy compatibility:
- Tested on Caali's proxy only.
- Opcodes provided for:
  - **EU** (patch **83.07**, [protocol version 353338 (full opcode list)](https://github.com/tera-proxy/tera-data/blob/master/map/protocol.353338.map))
  - **NA** (patch **83.07**, [protocol version 353337 (full opcode list)](https://github.com/tera-proxy/tera-data/blob/master/map/protocol.353337.map))
  - **SEA** (patch **83.07**, [protocol version 353339 (full opcode list)](https://github.com/tera-proxy/tera-data/blob/master/map/protocol.353339.map))
  - **RU** (patch **82.05**, [protocol version 353342 (full opcode list)](https://github.com/tera-proxy/tera-data/blob/master/map/protocol.353342.map)

## Setup:
- Copy/paste all .def files from the [protocol folder](https://github.com/CattaLol/Corsair-Memes/tree/master/protocol) to `<path to proxy>\node_modules\tera-data\protocol\`.
- Copy/paste the opcodes (as appropriate to your region) from the map folder into the corresponding .map file within `<path to proxy>\node_modules\tera-data\map\`.
  - C_BROADCAST_CLIMBING
    - Packet sent by client while you're moving up/down on a ladder
  - C_BATTLE_FIELD_START_OCCUPATION
    - Packet sent by client when you initiate a capture on a battleground pyre in Corsairs / Fraywind
- Note: if opcodes are not provided for your region (and patch), you can log them yourself with tools such as https://github.com/Owyn/alex-packet-id-finder or https://github.com/Owyn/PacketsLogger.
- Enjoy the memes!

## Commands (in the proxy channel):
### csmemes help
- Prints (in the proxy channel, and in the proxy console) the list of available commands for this mod.
### csmemes instantclimb [percentage - optional]
- If no percentage is given, toggles instant ladder climbing on/off.
- If percentage is given, this sets the **percentage height at which you will be automatically teleported to the top of the ladder**. For any value above 95, you will probably encounter a minor desync, in which you will go through
the finish-climbing-animation (and unable to use WASD to move freely), but you will be free to jump or cast skills (in which case the animation breaks and you will have full freedom of movement immediately).
   - Example: *csmemes instantclimb 99* will finish your climb when you're at the top of the ladder, with a client-sided animation that you can get out of with any skill or jump.
   - Example: *csmemes instantclimb 50* will finish your climb when you're halfway up the ladder,
   - Example: *csmemes instantclimb 0* will instant-finish your climb as soon as you begin to climb up.
### csmemes crystalback
- Teleports behind the crystal (anchorstone) in the defending castle.
### csmemes crystalfront
- Teleports in front of the crystal (anchorstone) in the defending castle.
### csmemes leftcannon
- Teleports beside the **left cannon** in the crystal room.
### csmemes rightcannon
- Teleports beside the **right cannon** in the crystal room.
### csmemes innergate
- Teleports *behind* the **Inner Gate**.
### csmemes capnorth
- Begin capturing the **North Pyre**.
### csmemes capmid
- Begin capturing the **Middle Pyre**.
### csmemes capsouth
- Begin capturing the **South Pyre**.
### csmemes northpyre
- Teleport beside the **North Pyre**.
### csmemes midpyre
- Teleport beside the **Mid Pyre**.
### csmemes southpyre
- Teleport beside the **South Pyre**.

## Config.json properties:
### instantClimb [true/false]
- If true, enables instant climbing.
### instantClimbThreshold [0-99]
- How far up the ladder (in %) before instantly finishing your climb.
