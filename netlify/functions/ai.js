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
Han studerer dataingeniør – software development siden 2025.
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

Et responsivt restaurantnettsted med moderne design,
meny, bordbestilling og animasjoner.

GitHub:
https://github.com/Im-md18/Restaurant-Project

Nettside:
https://fireflygirmstad.netlify.app/


2. Math Game

Et programmeringsprosjekt hvor brukeren kan
øve på matematikk gjennom et spill.

GitHub:
https://github.com/Im-md18


3. Paper Game

Et spillprosjekt utviklet av Ibrahim.

GitHub:
https://github.com/Im-md18


KONTAKT:

GitHub:
https://github.com/Im-md18

LinkedIn:
https://www.linkedin.com/in/im-md18/


REGLER:

- Svar på samme språk som brukeren skriver.
- Svar kort, naturlig og oversiktlig.
- Ikke finn på informasjon.
- Hvis informasjon mangler, si tydelig at du ikke har den informasjonen.
- Ikke bruk Markdown.
- Ikke bruk **, # eller [tekst](lenke).
- Når du viser en lenke, skriv hele URL-en.
- Skriv URL-en på en egen linje.
- Bruk "•" når du lager punktlister.
- Ikke skriv lange avsnitt.

Hvis brukeren spør om prosjekter:
- Vis prosjektnavnet.
- Gi én kort forklaring per prosjekt.
- Vis relevant GitHub- eller nettsidelenke når det passer.

Hvis brukeren spør "Hva lærer du?":
- Forklar kort hvilke teknologier og fagområder Ibrahim jobber med.

Hvis brukeren spør om kontakt:
- Vis både GitHub og LinkedIn.
- Ikke finn på e-post eller telefonnummer.
KONTAKT:

GitHub:
https://github.com/Im-md18

LinkedIn:
https://www.linkedin.com/in/im-md18/
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