using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Webcanis.Pages;

[ValidateAntiForgeryToken]
public class IndexModel(IConfiguration configuration, ILogger<IndexModel> logger) : PageModel
{
    [BindProperty, Required, StringLength(100)]
    public string Name { get; set; } = "";

    [BindProperty, StringLength(120)]
    public string? Company { get; set; }

    [BindProperty, Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = "";

    [BindProperty, Required, StringLength(10000)]
    public string Message { get; set; } = "";

    [TempData]
    public string? StatusMessage { get; set; }
    [TempData]
    public string? StatusType { get; set; }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            StatusMessage = "Please enter your name, a valid email, and your project details.";
            StatusType = "error";
            return Page();
        }

        var host = configuration["Smtp:Host"];
        var username = configuration["Smtp:Username"];
        var password = configuration["Smtp:Password"];
        var portSetting = configuration["Smtp:Port"];
        var port = 587;
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username)
            || string.IsNullOrWhiteSpace(password)
            || (portSetting is not null && (!int.TryParse(portSetting, out port) || port < 1 || port > 65535)))
        {
            StatusMessage = "Our contact form is currently unavailable. Please try again later.";
            StatusType = "error";
            return Page();
        }

        try
        {
            using var mail = new MailMessage
            {
                From = new MailAddress(username),
                Subject = "Webcanis project inquiry",
                Body = $"Name: {Name}\nCompany: {Company}\nEmail: {Email}\n\n{Message}"
            };
            mail.To.Add("uliwrok@gmail.com");
            mail.ReplyToList.Add(new MailAddress(Email));
            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(username, password)
            };
            await client.SendMailAsync(mail);
            StatusMessage = "Thank you! Your message has been sent.";
            StatusType = "success";
            return RedirectToPage("/Index", null, "contacto");
        }
        catch (Exception error) when (error is SmtpException or FormatException or ArgumentException)
        {
            logger.LogWarning("Contact email delivery failed ({ErrorType}).", error.GetType().Name);
            StatusMessage = "Your message could not be sent. Please try again later.";
            StatusType = "error";
            return Page();
        }
    }
}
