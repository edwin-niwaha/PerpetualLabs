# Perpetual Labs email domain

Outgoing sender: `Perpetual Labs <notifications@perpetuallabs.tech>`.

The API uses `config.email_backends.ResendEmailBackend` for outgoing mail. `RESEND_FROM_EMAIL` and `DEFAULT_FROM_EMAIL` use the sender above. Keep `HOST_EMAIL` pointed at an existing, monitored inbox; verifying a sending domain does not create an inbox at that domain.

## Finish Resend verification

1. In https://resend.com/domains, add `perpetuallabs.tech` with sending enabled.
2. Copy the exact DNS records Resend generates. The DKIM value is specific to your account; do not invent or reuse another domain's DKIM value.
3. Add those records at your authoritative DNS provider. The current nameservers are `dns1.registrar-servers.com` and `dns2.registrar-servers.com` (Namecheap DNS). The sending records normally include a DKIM TXT record at `resend._domainkey` and SPF TXT plus MX records at the return-path subdomain shown by Resend. Use the exact host, value and priority from your dashboard.
4. Preserve existing root MX and SPF records. Sending verification does not require enabling Resend inbound receiving or replacing your existing mailbox provider.
5. Click Verify in Resend and wait for the domain status to become Verified. If your sending API key is restricted to the previous domain, create a sending key authorized for `perpetuallabs.tech` and put it in the API environment as `RESEND_API_KEY`.
6. Use the same sender and key in the deployed API's environment, then restart/redeploy it. Local `.env` changes do not change hosting-provider secrets.

After verification, send a new, non-sensitive test message to a recipient you authorize. Provider acceptance does not confirm inbox delivery; check Resend events and the recipient's inbox/spam folder. Do not retry stored contact submissions merely to test domain configuration.

References: https://resend.com/docs/dashboard/domains/introduction
