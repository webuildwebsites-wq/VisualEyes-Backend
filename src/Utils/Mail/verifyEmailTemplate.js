const VerificationEmail = (username, otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #eeeeee;
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    }

    .header {
      background-color: #f2b63f;
      padding: 22px;
      text-align: center;
      color: #1f1f1f;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .content {
      padding: 32px;
      color: #333333;
      background-color: #f0f0f0;
      line-height: 1.7;
      font-size: 15px;
    }

    .content p {
      margin: 0 0 18px;
    }

    .otp-box {
      margin: 24px auto;
      text-align: center;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #1f1f1f;
      background-color: #fff7e0;
      border: 2px dashed #f2b63f;
      padding: 14px 0;
      border-radius: 8px;
      width: 70%;
    }

    .note {
      color: #6b6b6b;
      font-size: 13px;
      margin-top: 10px;
    }

    .footer {
      background-color: #cfcfcfff;
      text-align: center;
      padding: 16px;
      font-size: 12px;
      color: #000000ff;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      VISUAL EYES
    </div>

    <div class="content">
      <p>Hey <strong>${username}</strong>,</p>

      <p>
        Welcome to <strong>VisualEyes</strong> 👋  
        Use the verification code below to confirm your account.
      </p>

      <div class="otp-box">${otp}</div>

      <p class="note">
        This code is valid for a limited time.  
        If you didn’t request this, you can safely ignore this email.
      </p>

      <p>
        Need help? Our support team has your back 💛
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} VisualEyes Optik Technologies Pvt. Ltd.<br />
      All Rights Reserved.
    </div>
  </div>
</body>
</html>
  `;
};

export default VerificationEmail;
