# Hyperframes Composition Brief: Sonarora

Create the exact 80-second, 1920×1080, 30fps product film described in brag-plan.md. User requested 80 seconds, overriding Brag's normal 15–25-second limit. Use the current local React app as source, not the older deployed README screenshots. Keep the live application unchanged.

Source files: PRODUCT.md, DESIGN.md, index.html, src/style.css, src/App.tsx, src/components/DecisionViews.tsx, src/application/adapter.ts, src/application/session.ts. Use actual UI captures with invented example values. Reuse the real local Manrope and Source Sans 3 font files. Core source line: “See the trade-offs before you buy stock.” The on-screen product brand is Sonarora; repository name is sonaroraaah.

LOOK: #f4f8f8 ground / #102d3b ink / #007d87 accent / #e8f3f4 secondary; Manrope Variable 750 headings; Source Sans 3 Variable body. Keep important copy in the 80% title-safe region and product inside 90% action-safe. Calm editorial motion; stable reading holds; no generic glow, pulse, or bouncing UI.

Use nine editable sub-compositions with durations 7, 7, 11, 10, 11, 11, 11, 7, 5 seconds. Root duration exactly 80 seconds. One paused seekable GSAP timeline per scene. No runtime network dependencies: local GSAP, fonts, screenshots and audio. Use semantic HTML for all film titles and captions so check audits their contrast. Source screenshots remain genuine; any framing labels are separate editorial elements.

Audio: copy vol.12 music and sparse low-risk SFX from the installed Brag assets. Music volume .28; fade in 1s / out 3s. Credit “Music: Sascha Ende, ende.app (CC BY 4.0)” on the final frame and in the share text. No voiceover. Cue JSON from Brag is timing guidance, not a reason to rush text. Audio-reactive extraction depends on the media-use helper; document failure if unavailable, never block a good render.

Facts: show actual 6.25% / 0% / 0% outputs from the invented example and explicitly say 0% in this model is not a guarantee. Never present lowest risk as a recommendation. Show the purchase popup and friendly validation. No fabricated market, revenue or customer claims; no real financial data or credentials. Not financial advice; no banking connection or payments.

Output: brag-output/brag.mp4; strongest settled product frame as brag.jpg baked into frame 0; share-copy.txt; full editable composition and capture/build scripts. Run Hyperframes check with nonzero text coverage, inspect key frames, open and verify a local preview, then render locally as already requested. Verify final duration with ffprobe and inspect decoded MP4 frames.

Implementation notes: the bundled registry search returned no matching transition entries, so this composition uses native GSAP entrances and image swaps under the documented Hyperframes contract. Audio extraction succeeded with the media-use helper; the product reveal’s border presence is informed by measured RMS, without continuous pulsing. Reading holds of roughly 3–6 seconds are deliberate for the requested 80-second caption-led demonstration.

Final readability review: the purchase scene holds the supplier-input popup rather than showing its dense diagnostic/rounding paragraph. The comparison scenes already demonstrate real engine output.
