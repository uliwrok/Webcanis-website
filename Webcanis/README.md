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

## Future laptop model integration

The model remains at `artifacts/laptop/generic-laptop.glb` and is not loaded,
modified, or copied into public assets. No WebGL dependency was added.

`showcase-journey` groups Home, Solutions and Projects as one scroll boundary.
Its Bootstrap visual column keeps the existing static artwork visible until
Projects ends. `_LaptopReference.cshtml` owns that temporary artwork. Future
integration can replace it with one shared stage without changing section IDs.
Keep the content readable and interactive beside the stage; do not pin the text
or intercept scrolling. How we work starts after the stage's boundary.

Below 992px, the artwork appears once in the hero and the content becomes a
single column. Maintain a static fallback and reduced-motion behavior when
implementing the model. Lighting, model loading and scroll-driven lid motion
are intentionally deferred.
