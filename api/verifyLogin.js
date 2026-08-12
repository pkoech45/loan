export default async function handler(req, res) {


if (req.method !== "POST") {
    return res.status(405).json({
        success: false,
        message: "Method not allowed"
    });
}

try {

    const {
        phone,
        applicationId,
        code
    } = req.body || {};

    if (!phone || !applicationId || !code) {
        return res.status(400).json({
            success: false,
            message: "Phone, application ID and loan code are required."
        });
    }

    if (!/^\+2637\d{8}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: "Invalid phone number."
        });
    }

    if (!/^\d{4}$/.test(String(code))) {
        return res.status(400).json({
            success: false,
            message: "Loan code must contain exactly 4 digits."
        });
    }

    const MOCK_API =
        "https://6a7ae4d98c69b3eb4a17a33f.mockapi.io/approval";

    /*
     * Get the application from MockAPI.
     */
    const response = await fetch(
        `${MOCK_API}/${encodeURIComponent(applicationId)}`
    );

    if (!response.ok) {

        return res.status(404).json({
            success: false,
            message: "Application not found."
        });

    }

    const application =
        await response.json();

    /*
     * Only approved applications can continue.
     */
    if (
        String(application.status).toLowerCase() !==
        "approved"
    ) {

        return res.status(403).json({
            success: false,
            message: "This application has not been approved."
        });

    }

    /*
     * Compare the submitted phone number
     * with the application phone.
     */
   const submittedPhone = normalizeZimbabwePhone(phone);
const storedPhone = normalizeZimbabwePhone(application.phone);

if (submittedPhone !== storedPhone) {
    return res.status(401).json({
        success: false,
        message: "Phone number does not match the application."
    });
}

    /*
     * The approved application should contain
     * a loanCode field, for example:
     *
     * loanCode: "4827"
     */
    const storedLoanCode =
        String(application.loanCode || "");

    if (!storedLoanCode) {

        return res.status(400).json({
            success: false,
            message: "A loan code has not been assigned to this application yet."
        });

    }

    /*
     * Check the 4-digit loan code.
     */
    if (String(code) !== storedLoanCode) {

        return res.status(401).json({
            success: false,
            message: "Incorrect loan code."
        });

    }

    /*
     * Successful verification.
     *
     * Do NOT return the stored loan code.
     */
    return res.status(200).json({
        success: true,
        message: "Loan code verified successfully.",
        applicationId: applicationId
    });

} catch (error) {

    console.error(
        "Loan code verification error:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Unable to verify loan code."
    });

}


}
