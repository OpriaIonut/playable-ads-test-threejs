# Playable Ads Assignment

This is project is a prototype for a playable ad developed in Three.js.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## Versions

### v1 - primitive playable

* Contains the fully playable game with all features required for it, but with primitive graphics.
* I isolated all of the rendering-related logic and the game loop in the `Game.ts` class, and implemented an `IUpdatable` interface which makes it easy to add objects to the game loop without having to modify the game class at all.
* I created an algorithm to spawn the tiles based off of a small texture (currently 26x26 pixels). Each pixel in this texture represents a tile that needs to be shot, the colors of the tiles and of the turrets get created based on the data in this texture (transparent pixels will be skipped). This allows us to very easily change the level without having to modify any of the game code (we just change a texture and the level will adapt by itself). It introduces an extra network call, but the size of the texture is very small so it won't impact loading times.
* Turets have a certain amount of bullets they can shoot afterwards they get destroyed.
* Game is lost when the reserve is full and a new turret tries to enter on it (reaches the end of the threadmill)
* Game is won if all tiles are destroyed
