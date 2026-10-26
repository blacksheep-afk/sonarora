# Sonarora product film

80 seconds · 1920×1080 · 30 fps · H.264 MP4 with AAC music · no narration.

- `brag.mp4` — finished video, including the selected poster as its first frame.
- `brag.jpg` — settled brand/product reveal, usable as a custom thumbnail.
- `share-copy.txt` — post-ready caption and music attribution.
- `brag-plan.md` / `composition-brief.md` — storyboard and creative decisions.
- `composition/` — editable Hyperframes source with local fonts, music and real app captures.
- `verification.json` — encoded duration, resolution, frame count and audio checks.
- `check.json` — Hyperframes layout/runtime/contrast gate result.

The film shows invented R600/R500/R250 example inputs and actual model output. It does not promise safety or recommend a transaction. It explains the model’s tied results and distinguishes zero modelled risk from a guarantee.

Music: “Happy Beats / Business Moves”, Vol. 12, Sascha Ende, [ende.app](https://ende.app/en), CC BY 4.0. SFX: Kenney, CC0. Music credit is on the end card and in the share copy. Fonts come from the app’s existing Fontsource packages. No voice track was generated.

## Editing and re-rendering

The project was built with Hyperframes 0.8.204 and the Brag 0.5.0 skill. Use a Node 22+ installation, FFmpeg/FFprobe, and local Chrome. The helper `composition/hyperframes.sh` points to this machine’s installed CLI cache and the project-local encoding binaries; update the paths or run `npx hyperframes@0.8.204` if moving the folder elsewhere. Preview is local only at `http://localhost:3017/#project/composition` while its server is running.

`build.py` regenerates the composition from the storyboard implementation. `capture.py` captures the running local app at port 5173 using invented example data. `finalize.py` picks and bakes the poster and verifies the final encode.

Only disposable `.browser-cache/chromium-1248` and `.browser-cache/firefox-1555` test downloads were cleared to meet the renderer’s 1 GB free-space requirement. The Chromium headless shell remains. The disposable WebKit cache was also cleared later when the disk filled during narration preparation. These test downloads can be restored with the project’s Playwright install command when sufficient disk space is available; application source and documents were not removed.
