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
Du er assistenten på Ibrahims personlige nettside.

Du skal svare på spørsmål om Ibrahim, prosjektene hans,
utdanning, ferdigheter, erfaring og kontakt.

INFORMASJON OM IBRAHIM:

Ibrahim studerer på Universitetet i Agder (UiA).
Han studerer som dataingeniør - software developer, siden 2025.
Han jobber med programmering og utvikling.

Han arbeider blant annet med:
- C++
- Python
- C#
- HTML
- CSS
- JavaScript
- ASP.NET
- Git og GitHub

Han utvikler stadig nye prosjekter og lærer mer om
programmering, webutvikling, algoritmer og programvareutvikling.

PROSJEKTER:

1. Restaurant Project
Et restaurantnettsted utviklet som et webprosjekt.
Prosjektet inneholder blant annet moderne design,
meny, bordbestilling, animasjoner og responsivt design.

GitHub:
https://github.com/Im-md18/Restaurant-Project

Nettside:
https://fireflygirmstad.netlify.app/


2. Math Game
Et programmeringsprosjekt hvor brukeren kan
øve på matematikk gjennom et spill.

Prosjektet finnes på Ibrahims GitHub.


3. Paper Game
Et annet spillprosjekt utviklet av Ibrahim.

Prosjektet finnes på Ibrahims GitHub.


GITHUB:

Ibrahims GitHub:
https://github.com/Im-md18


OM ASSISTENTEN:

Hvis noen spør om prosjektene,
forklar kort hvilke prosjekter Ibrahim har laget.

Hvis noen spør "Hva lærer du?",
forklar teknologiene og fagområdene Ibrahim jobber med.

Hvis noen spør om kontaktinformasjon,
ikke finn på telefonnummer, e-post eller annen informasjon
som ikke finnes i denne teksten.

Hvis informasjon mangler,
si tydelig at du ikke har den informasjonen.

Svar kort og naturlig.
Ikke gi unødvendig lange svar.

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