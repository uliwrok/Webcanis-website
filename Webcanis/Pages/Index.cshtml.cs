using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text;
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
            var company = string.IsNullOrWhiteSpace(Company) ? "Not provided" : Company;
            var htmlMessage = WebUtility.HtmlEncode(Message)
                .Replace("\r\n", "<br>")
                .Replace("\n", "<br>")
                .Replace("\r", "<br>");
            var htmlBody = $$"""
                <!doctype html>
                <html lang="en">
                <body style="margin:0;padding:32px 12px;background:#f1f2ef;font-family:Arial,Helvetica,sans-serif;color:#302a28;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;">
                    <tr>
                      <td style="padding:24px 32px;background:#34483c;color:#ffffff;">
                        <div style="font-size:12px;letter-spacing:2px;">WEBCANIS</div>
                        <h1 style="margin:12px 0 0;font-size:24px;font-weight:600;">New project inquiry</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:28px 32px 12px;font-size:15px;line-height:1.6;">
                        A new message was submitted through the Webcanis contact form.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 32px 24px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;line-height:1.5;">
                          <tr><th align="left" style="width:120px;padding:10px 12px;border-bottom:1px solid #e5e4e2;color:#5e5856;">Name</th><td style="padding:10px 12px;border-bottom:1px solid #e5e4e2;">{{WebUtility.HtmlEncode(Name)}}</td></tr>
                          <tr><th align="left" style="padding:10px 12px;border-bottom:1px solid #e5e4e2;color:#5e5856;">Company</th><td style="padding:10px 12px;border-bottom:1px solid #e5e4e2;">{{WebUtility.HtmlEncode(company)}}</td></tr>
                          <tr><th align="left" style="padding:10px 12px;border-bottom:1px solid #e5e4e2;color:#5e5856;">Email</th><td style="padding:10px 12px;border-bottom:1px solid #e5e4e2;">{{WebUtility.HtmlEncode(Email)}}</td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 32px 32px;">
                        <h2 style="margin:0 0 10px;font-size:16px;">Project details</h2>
                        <div style="padding:16px;background:#f6f6f3;border-left:3px solid #a53517;font-size:14px;line-height:1.6;overflow-wrap:anywhere;">{{htmlMessage}}</div>
                      </td>
                    </tr>
                    <tr><td style="padding:16px 32px;border-top:1px solid #e5e4e2;color:#5e5856;font-size:12px;">Sent via the Webcanis contact form. Reply to this email to contact the sender.</td></tr>
                  </table>
                </body>
                </html>
                """;

            using var mail = new MailMessage
            {
                From = new MailAddress(username),
                Subject = "New project inquiry | Webcanis",
                Body = $"New project inquiry - Webcanis\n\nName: {Name}\nCompany: {company}\nEmail: {Email}\n\nProject details:\n{Message}\n\nReply to this email to contact the sender.",
                BodyEncoding = Encoding.UTF8,
                SubjectEncoding = Encoding.UTF8
            };
            mail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, Encoding.UTF8, MediaTypeNames.Text.Html));
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
