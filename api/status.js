const MOCK_API =
    "https://6a7ae4d98c69b3eb4a17a33f.mockapi.io/approval";


export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({

            success: false,

            message:
                "Method not allowed"

        });

    }


    const id =
        req.query.id;


    if (!id) {

        return res.status(400).json({

            success: false,

            message:
                "Application ID is required"

        });

    }


    try {

        const response =
            await fetch(
                `${MOCK_API}/${id}`
            );


        if (!response.ok) {

            return res.status(404).json({

                success: false,

                message:
                    "Application not found"

            });

        }


        const application =
            await response.json();


        return res.status(200).json({

            success: true,

            status:
                application.status

        });


    } catch (error) {

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                "Unable to check status"

        });

    }

}