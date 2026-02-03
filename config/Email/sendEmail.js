import { sendEmail } from "./emailService.js";

const sendEmailFun=async({sendTo, subject, text, html})=>{
  try {
    const result = await sendEmail(sendTo, subject, text, html);
    console.log("result  : ",result);
    if (result.success) {
      return { message: 'Email sent successfully', messageId: result.messageId };
    } else {
      return { message: 'Failed to send email', error: result.error };
    }
  } catch (error) {
    console.log("Error. :",error);
    return { message: 'Error sending email', error: error.message };
  }
}


export default sendEmailFun;