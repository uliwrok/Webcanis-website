using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorPages();

var app = builder.Build();

var contentTypes = new FileExtensionContentTypeProvider();
contentTypes.Mappings[".glb"] = "model/gltf-binary";
app.UseStaticFiles(new StaticFileOptions { ContentTypeProvider = contentTypes });
app.MapRazorPages();

app.Run();
