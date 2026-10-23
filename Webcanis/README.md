# Webcanis

ASP.NET Core 8 Razor Pages landing page for a B2B web development team.
Bootstrap 5.3.3, fonts and reference images are served locally from `wwwroot`.

Run from the repository root with .NET 8 or later:

```powershell
dotnet run --project Webcanis/Webcanis.csproj --launch-profile http
```

Open http://localhost:5062.

## Page structure

English copy follows the collaborative direction: “You know your business.
We help you build what comes next.” The page includes Solutions, Projects,
How we work, About, Contact, and the footer. Project briefs are explicitly
labeled as illustrative solution concepts, not client case studies.

`Pages/Index.cshtml` contains the content and Bootstrap layout.
`wwwroot/css/site.css` contains semantic colors, typography, responsive rules,
visible keyboard focus, and reduced-motion support. `wwwroot/js/site.js`
closes the Bootstrap mobile navigation after an anchor is selected.

The contact destination is intentionally unset. The form is disabled and
collects no data. No sending endpoint or success confirmation is implemented.

## 3D laptop and scroll

Home, Solutions and Projects follow the supplied Figma compositions. The sample
browser bar is excluded, the navbar stays fixed, and all copy remains in English.

One GLB scene and one WebGL canvas replace all laptop images. The published asset
is `wwwroot/models/generic-laptop.glb`, copied from the editable source in
`artifacts/laptop/`. ASP.NET explicitly serves `.glb` as `model/gltf-binary`.
Three.js 0.180.0 and the required addons are vendored under `wwwroot/lib/three/`
with their MIT license; the page makes no CDN requests at runtime.

`wwwroot/js/laptop-motion.mjs` defines the three reference poses in the original
1728 × 1077 content coordinates. Between them, scroll continuously interpolates
position, framing, rotation and the lid hinge. Home uses a slightly wider framing,
Solutions holds the screen vertical, and Projects closes the lid with 2° of
overtravel to seal the model's visible gap.
`laptop-model.js` uses perspective framing, studio environment lighting and
on-demand rendering capped at 1.5 device pixels per CSS pixel. It does not run
an idle animation loop or play a separate animation over the manual hinge.

On viewports at least 1100 × 680, `site.js` keeps the content stationary while it
fades and blurs. The model stays outside that effect. Smaller viewports and
reduced-motion preferences retain ordinary document scrolling; the same canvas
is moved between the three static model slots, without creating more contexts.
A WebGL/model-loading failure leaves the content usable with an unavailable note.
The contact form remains disabled and collects no data.

## How we work

The four process stages share one pinned desktop section. Native scroll moves
the subtitles across the canvas and raises the active stage; clicking a subtitle
scrolls to the corresponding position. Arrow keys, Home and End select stages.
Smaller screens use a compact clickable tab layout. Reduced motion disables
pinning and scroll animation. Without JavaScript all descriptions
remain readable. The future visual's space is intentionally empty.

Motion checks: `node Webcanis/tests/process-motion.test.mjs`.

## Conditional screen images

The screen starts with `images/solutions/example1.png`, including in Home.
The three Solutions cards are keyboard-accessible buttons that select example1,
example2 or example3 respectively. Selection persists while scrolling between
sections, and only the latest image request can update the preview. Both embedded placeholder maps are removed;
an unlit material keeps future images independent of studio reflections.
The runtime screen is offset 0.6 mm in front of the exported solid gasket to
prevent image occlusion, without changing the original GLB.

When a business condition is defined, code in `wwwroot/js/` can use:

```javascript
const { setLaptopScreenImage } = await import('./laptop-model.js');
await setLaptopScreenImage(condition ? '/images/projects/portal.webp' : null);
```

Use same-origin HTTP(S) assets, preferably 16:9 (1920 × 1080 or 1024 × 576).
`null` clears the screen. Calls made before model loading are queued; during
rapid condition changes only the latest request can replace the screen. Failed
image loads reject the promise and preserve the previous image. Replaced and
stale textures are disposed. The first Solutions card is selected by default.

## Verification

```powershell
node Webcanis/tests/laptop-motion.test.mjs
dotnet build Webcanis/Webcanis.csproj
```

The motion test checks pose endpoints, continuity, reverse scrubbing, hinge
closure, and the published GLB's hierarchy and screen UVs. Browser checks cover
actual model rendering, one-canvas reuse, image assignment/clearing, rapid image
changes, local URL validation, and responsive navigation.
