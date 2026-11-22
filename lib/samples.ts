// Demo emails. All domains use the reserved .example TLD or TEST-NET IP ranges,
// so nothing here points to a real site.

export const SAMPLES: { id: string; label: string; text: string }[] = [
  {
    id: "credential",
    label: "Fake Microsoft 365 login",
    text: `From: "Microsoft 365 Security" <no-reply@m1crosoft-security.example>
Reply-To: helpdesk.verify@mailbox-support.example
Return-Path: <bounce@bulk-sender.example>
Subject: Action required: your mailbox will be suspended
Authentication-Results: mx.contoso.example; spf=softfail smtp.mailfrom=bulk-sender.example; dkim=none; dmarc=fail header.from=m1crosoft-security.example

Dear user,

We detected unusual sign-in activity on your account. Your mailbox will be suspended within 24 hours unless you verify your account.

Please sign in to keep your access: <a href="http://203.0.113.45/o365/login.php">https://login.microsoftonline.com</a>

Thank you,
Microsoft 365 Security Team`,
  },
  {
    id: "bec",
    label: "Invoice / bank change (BEC)",
    text: `From: "Mark Reyes - CFO" <mark.reyes.cfo@gmail.com>
Subject: Urgent - updated bank details for today's payment

Hi,

I'm in a meeting and can't talk. Our supplier's bank details have changed. Please process the outstanding invoice of USD 48,500 by wire transfer today to the new account below and confirm when done.

Keep this confidential until the audit is closed.

Mark
Sent from my phone`,
  },
  {
    id: "legit",
    label: "Normal internal email",
    text: `From: "Ana Santos" <ana.santos@contoso.example>
Subject: Notes from Tuesday's project sync
Authentication-Results: mx.contoso.example; spf=pass smtp.mailfrom=contoso.example; dkim=pass header.d=contoso.example; dmarc=pass

Hi team,

Thanks for joining the sync on Tuesday. Attached are the notes and the updated timeline. The next review is on the 5th; please add your updates to the shared tracker before then.

Regards,
Ana`,
  },
];
