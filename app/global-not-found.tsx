'use client';

export default function NotFound() {
    return (<>
        <html>
            <head>
                {/* <meta charset="UTF-8" /> */}
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>404 Not Found</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true"/> */}
                <link href="https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap" rel="stylesheet" />
            </head>

            <body style={{
                fontFamily: "'Gamja Flower', cursive",
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: '#fff2c7',
            }}>
                <img src="/duck_mistake.png" alt="Duck made a mistake :(" width="200" height="auto" />
                <h1>404 Not Found</h1>
                <p>Must have gotten lost in the post...</p>
                <a href="/" style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f0003e',
                    color: '#fefefe',
                    textDecoration: 'none',
                    borderRadius: '0.25rem',
                }}>
                    go home
                </a>
            </body>

        </html>
    </>
    );
}
