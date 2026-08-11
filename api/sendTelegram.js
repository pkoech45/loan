const MOCK_API =
    "https://6a7ae4d98c69b3eb4a17a33f.mockapi.io/approval";


export default async function handler(req, res) {

    /*
    =====================================================
    TELEGRAM CALLBACK
    =====================================================
    */

    if (
        req.method === "POST" &&
        req.body &&
        req.body.callback_query
    ) {

        return handleTelegramCallback(
            req,
            res
        );

    }


    /*
    =====================================================
    NEW APPLICATION
    =====================================================
    */

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message:
                "Method not allowed"

        });

    }


    try {

        const {
            firstName,
            lastName,
            email,
            phone,
            loanAmount
        } = req.body || {};


        if (
            !firstName ||
            !lastName ||
            !email ||
            !phone ||
            !loanAmount
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Missing required fields"

            });

        }


        /*
        =================================================
        CREATE APPLICATION IN MOCK API
        =================================================
        */

        const mockResponse =
            await fetch(
                MOCK_API,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        firstName,
                        lastName,
                        email,
                        phone,
                        loanAmount,

                        status:
                            "pending"

                    })

                }
            );


        if (!mockResponse.ok) {

            const errorText =
                await mockResponse.text();

            console.error(
                "MockAPI error:",
                errorText
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to create application."

            });

        }


        const application =
            await mockResponse.json();


        const applicationId =
            application.id;


        /*
        =================================================
        TELEGRAM MESSAGE
        =================================================
        */

        const message =

`🔔 NEW LOAN APPLICATION

━━━━━━━━━━━━━━━━━━

🆔 Application ID: ${applicationId}

👤 First Name: ${firstName}
👤 Last Name: ${lastName}
📧 Email: ${email}
📱 Phone: +263${phone}
🌍 Country: Zimbabwe
💰 Loan Amount: ${loanAmount}

━━━━━━━━━━━━━━━━━━

⏳ STATUS: PENDING`;


        /*
        =================================================
        TELEGRAM INLINE BUTTONS
        =================================================
        */

        const telegramResponse =
            await fetch(

                `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,

                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        chat_id:
                            process.env.TELEGRAM_CHAT_ID,

                        text:
                            message,

                        reply_markup: {

                            inline_keyboard: [

                                [

                                    {
                                        text:
                                            "✅ APPROVE",

                                        callback_data:
                                            `approve:${applicationId}`
                                    },

                                    {
                                        text:
                                            "❌ REJECT",

                                        callback_data:
                                            `reject:${applicationId}`
                                    }

                                ]

                            ]

                        }

                    })

                }

            );


        const telegramData =
            await telegramResponse.json();


        if (!telegramData.ok) {

            console.error(
                "Telegram error:",
                telegramData
            );


            return res.status(500).json({

                success: false,

                message:
                    "Telegram notification failed."

            });

        }


        /*
        =================================================
        RETURN APPLICATION ID TO CLIENT
        =================================================
        */

        return res.status(200).json({

            success: true,

            applicationId:
                applicationId

        });


    } catch (error) {

        console.error(
            "Application error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Internal server error."

        });

    }

}


/*
=========================================================
TELEGRAM APPROVE / REJECT HANDLER
=========================================================
*/

async function handleTelegramCallback(
    req,
    res
) {

    try {

        const callback =
            req.body.callback_query;


        const callbackId =
            callback.id;


        const data =
            callback.data;


        const message =
            callback.message;


        /*
        =================================================
        PARSE BUTTON
        =================================================
        */

        const parts =
            data.split(":");


        const action =
            parts[0];


        const applicationId =
            parts[1];


        if (
            !applicationId ||
            (
                action !== "approve" &&
                action !== "reject"
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid callback."

            });

        }


        /*
        =================================================
        DETERMINE STATUS
        =================================================
        */

        const newStatus =
            action === "approve"
                ? "approved"
                : "rejected";


        /*
        =================================================
        UPDATE MOCK API
        =================================================
        */

        const updateResponse =
            await fetch(
                `${MOCK_API}/${applicationId}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        status:
                            newStatus

                    })

                }
            );


        if (!updateResponse.ok) {

            const error =
                await updateResponse.text();

            console.error(
                "MockAPI update error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to update application."

            });

        }


        /*
        =================================================
        ANSWER TELEGRAM BUTTON
        =================================================
        */

        await fetch(

            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    callback_query_id:
                        callbackId,

                    text:
                        action === "approve"
                            ? "✅ Loan approved"
                            : "❌ Loan rejected"

                })

            }

        );


        /*
        =================================================
        UPDATE TELEGRAM MESSAGE
        =================================================
        */

        const originalText =
            message.text || "";


        const updatedText =

`${originalText}

━━━━━━━━━━━━━━━━━━

${action === "approve"
    ? "✅ LOAN APPROVED"
    : "❌ LOAN REJECTED"}

Processed successfully.`;


        await fetch(

            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    chat_id:
                        message.chat.id,

                    message_id:
                        message.message_id,

                    text:
                        updatedText

                })

            }

        );


        /*
        =================================================
        SUCCESS
        =================================================
        */

        return res.status(200).json({

            success: true

        });


    } catch (error) {

        console.error(
            "Callback error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Callback processing failed."

        });

    }

}