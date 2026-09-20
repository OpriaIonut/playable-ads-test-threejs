# Playable Ads Assignment

This is project is a prototype for a playable ad developed in Three.js.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## General Notes

* To switch between the 2 skins, go into [main.ts](./src/main.ts) and change the `selectedTheme` variable. The entire game will adapt just by changing this one variable.
* You can also change the layout of the tiles. In [main.ts](./src/main.ts), if you change the texture passed to `tileManager`, all of the tiles and the turrets will adapt. The texture works in the following way:
    * Each pixel in the texture is considered a tile. Depending on how many pixels there are on the width & height, the tiles in the game will also stretch
    * An algorithm will extract the colors from the texture and spawn as many turrets are needed for each color
    * Transparent pixels with alpha values less than 0.1 will be skipped (this way we can make interesting tile layouts, draw fishes, 8 bit characters, etc.)
* Thanks to the architecture of the project it is very easy to create new skins for this game. We just have to create the assets for them, then in the [visuals](./src/scripts/visuals) folder create the visual implementation for them (basically a script that loads them and initializes them however needed: set special shaders, scale & position them, etc.). Afterwards add new entries in the [ThemeFactory](./src/scripts/managers/ThemeFactory.ts) for the new skin.

## Versions

### v4 - fish of fortune reskin

* Added objects which the turrets sit on when they are moving on the threadmill
* Added new meshes & shaders suited to the fish of fortune theme
* Made it easy to switch between the 2 game skins (in main.ts you just have to switch the `selectedTheme` and the entire game will adapt by itself)
* Cleaned up architecture by implementing abstract classes instead of interfaces (reduced a lot of duplicate code in the Visuals classes)

### v3 - visual polish

* Changed project architecture to easily switch between different game themes
* Added bullet trail, special font, tap VFX, 3D meshes for threadmill, pigs & reserve
* Added shadows
* Finetuned visuals to be closer to the video reference

### v2 - gameplay polish

* Increased the bullet speed from 1 to 2.5
* Made turrets look towards movement direction on the threadmill, and after they shoot a tile, they rotate towards the grid center

### v1 - primitive playable

* Contains the fully playable game with all features required for it, but with primitive graphics.
* I isolated all of the rendering-related logic and the game loop in the `Game.ts` class, and implemented an `IUpdatable` interface which makes it easy to add objects to the game loop without having to modify the game class at all.
* I created an algorithm to spawn the tiles based off of a small texture (currently 26x26 pixels). Each pixel in this texture represents a tile that needs to be shot, the colors of the tiles and of the turrets get created based on the data in this texture (transparent pixels will be skipped). This allows us to very easily change the level without having to modify any of the game code (we just change a texture and the level will adapt by itself). It introduces an extra network call, but the size of the texture is very small so it won't impact loading times.
* Turets have a certain amount of bullets they can shoot afterwards they get destroyed.
* Game is lost when the reserve is full and a new turret tries to enter on it (reaches the end of the threadmill)
* Game is won if all tiles are destroyed
