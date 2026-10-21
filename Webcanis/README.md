# Webcanis

ASP.NET Core 8 Razor Pages home page, based on the supplied Figma reference.
Bootstrap 5.3.3, fonts and original images are served locally from `wwwroot`.

Run from the repository root with the .NET 8 SDK or later:

```powershell
dotnet run --project Webcanis/Webcanis.csproj --launch-profile http
```

Open http://localhost:5062.

The homepage is `Pages/Index.cshtml`; visual adjustments are in `wwwroot/css/site.css`.
The browser toolbar in the reference is intentionally excluded. The mobile menu
uses Bootstrap Collapse. Solutions is reserved for a future page; Contact and
Start your Consultation have no destination yet, as requested. These controls
are disabled until their destinations are provided.
