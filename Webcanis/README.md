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

## Scroll compositions and future model integration

Home, Solutions and Projects follow the supplied Figma frames; the sample browser
bar is excluded. All copy remains in English. The global Bootstrap navbar stays
fixed at the top of the page.

`wwwroot/css/story.css` styles these three sections independently of the rest of
the landing. On viewports at least 1100px wide and 680px high, `site.js` enables
one sticky viewport. Each content layer fades and blurs in place as the user
scrolls; reversing the scroll reverses the effect. Inactive content is inert.
Navigation markers land in the fully readable portion of each scene.

The laptop image stage sits outside the content blur and crossfades between the
three original reference poses. `_LaptopReference.cshtml` owns their image layers
and crops. Callout dots and lines share a positioned, uniformly scaled group.
The GLB at `artifacts/laptop/generic-laptop.glb` is not loaded or modified. Replace
the image stage with the model in a future change; no WebGL dependency is present.

Smaller or shorter viewports, reduced-motion preferences, and browsers without
JavaScript get ordinary document sections with one static pose per section.
Resize restores section IDs and removes inactive states. The remaining Process,
About and Contact sections use ordinary scrolling. The contact form remains
disabled and collects no data.
