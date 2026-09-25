exports.handler = async function (event) {
    // Tillat bare POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                error: "Method not allowed"
            })
        };
    }

    try {
        const { question } = JSON.parse(event.body || "{}");

        // Sjekk at brukeren faktisk har skrevet noe
        if (!question || !question.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Du må skrive et spørsmål."
                })
            };
        }

        // API-nøkkelen skal ligge i Netlify,
        // IKKE direkte i koden.
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "OPENAI_API_KEY mangler."
                })
            };
        }

        // Send spørsmålet til OpenAI
        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({
                    model: "gpt-5.6-luna",

                    instructions: `
Du er AI-assistenten på Ibrahims personlige porteføljenettside.

Din jobb er å hjelpe besøkende med spørsmål om:
- Ibrahim
- prosjektene hans
- programmering
- hva han lærer
- porteføljen
- kontaktinformasjon

Svar kort, vennlig og profesjonelt.

Hvis du ikke har informasjonen som trengs,
skal du si at du ikke har nok informasjon
i stedet for å finne på et svar.

Svar på samme språk som brukeren skriver.
                    `,

                    input: question
                })
            }
        );

        // Hvis OpenAI gir en feil
        if (!response.ok) {
            const errorData = await response.text();

            console.error(
                "OpenAI error:",
                response.status,
                errorData
            );

            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "Kunne ikke hente svar fra AI."
                })
            };
        }

        const data = await response.json();

        // Finn tekstsvaret i Responses API-resultatet
        let answer = "";

        for (const output of data.output || []) {
            for (const content of output.content || []) {
                if (
                    content.type === "output_text" &&
                    content.text
                ) {
                    answer += content.text;
                }
            }
        }

        if (!answer) {
            answer = "Jeg klarte ikke å lage et svar akkurat nå.";
        }

        // Send svaret tilbake til nettsiden
        return {
            statusCode: 200,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                answer: answer
            })
        };

    } catch (error) {
        console.error("AI function error:", error);

        return {
            statusCode: 500,

            body: JSON.stringify({
                error: "Noe gikk galt med AI-assistenten."
            })
        };
    }
};