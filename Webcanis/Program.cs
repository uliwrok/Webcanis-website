using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.HttpOverrides;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorPages();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);

var app = builder.Build();
app.UseForwardedHeaders();

app.Use(async (context, next) =>
{
    var nonce = Convert.ToBase64String(RandomNumberGenerator.GetBytes(18));
    var processAnimation = string.Equals(context.Request.Path.Value, "/images/process/webcanis-process-morph.svg", StringComparison.OrdinalIgnoreCase);
    context.Items["CspNonce"] = nonce;
    context.Response.Headers["Content-Security-Policy"] = $"default-src 'self'; script-src 'self' 'nonce-{nonce}'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; object-src 'self'; base-uri 'self'; form-action 'self'" + (processAnimation ? "" : "; frame-ancestors 'none'");
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    if (!processAnimation) context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});

var contentTypes = new FileExtensionContentTypeProvider();
contentTypes.Mappings[".glb"] = "model/gltf-binary";
app.UseStaticFiles(new StaticFileOptions { ContentTypeProvider = contentTypes });
app.MapRazorPages();

app.Run();
