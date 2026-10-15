# Cube Studio

A responsive, single-page 3D Rubik’s Cube playground built with Three.js. Drag to orbit, click face buttons or use keyboard turns, scramble, undo/redo, customize center sticker colors, and reset the cube.

## Run locally

The site uses browser ES modules and loads Three.js from jsDelivr, so serve this folder over HTTP (rather than opening `index.html` as a `file://` URL). For example, with Python installed:

```bash
python -m http.server 8000
```

Open `http://localhost:8000` from this folder.

## Publish on GitHub Pages

1. Create a new GitHub repository and upload the contents of this `cube-studio` folder to its root. You can upload `index.html`, `style.css`, `app.js`, and `README.md` directly, or upload the project ZIP and extract it before publishing.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Wait for the Pages URL shown in that section and open it. The page needs an internet connection to load Three.js and the optional Google Fonts.

## Controls

- Drag the cube to orbit; use the on-screen `+` and `−` controls to zoom.
- Click `U D L R F B`, or press those keys. Hold **Shift** while clicking or pressing a key to turn the face in the reverse direction.
- **Scramble cube** applies a random 24-turn sequence. **Undo** and **redo** traverse recent turns. **Reset to solved** starts a fresh session.
- Color Lab changes the center sticker color for a selected face.

## About the solve guide

The guide explains a conventional beginner layer-by-layer route and standard move notation. It is instructional guidance, not a pattern-recognition solver: custom center colors and arbitrary manually entered sticker configurations are not analyzed or automatically solved. Reset returns the simulator to its solved starting state.

## Project files

- `index.html` — page structure and content
- `style.css` — responsive visual design
- `app.js` — Three.js scene, cube turns, controls, timer, and color editing

