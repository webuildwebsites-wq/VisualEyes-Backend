import { sendEmail } from "./emailService.js";

const sendOTPEmail = async ({ sendTo, subject, text, html }) => {
  try {
    const result = await sendEmail(sendTo, subject, text, html);
    
    if (result.success) {
      console.log("Email sent successfully to:", sendTo);
      return { success: true, message: 'Email sent successfully', messageId: result.messageId };
    } else {
      console.error("Failed to send email to:", sendTo, "Error:", result.error);
      return { success: false, message: 'Failed to send email', error: result.error };
    }
  } catch (error) {
    console.error("Error sending email:", error.message);
    return { success: false, message: 'Error sending email', error: error.message };
  }
}

export default sendOTPEmail;