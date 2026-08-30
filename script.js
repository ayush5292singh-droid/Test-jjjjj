/* =====================================================
   JARVIS
   SIMPLE + RELIABLE COMMAND ENGINE
===================================================== */


/* -----------------------------
   ELEMENTS
----------------------------- */

const micButton =
    document.getElementById("micButton");

const micText =
    document.getElementById("micText");

const micState =
    document.getElementById("micState");

const statusText =
    document.getElementById("status");

const transcriptText =
    document.getElementById("transcriptText");

const recognitionState =
    document.getElementById("recognitionState");

const commandInput =
    document.getElementById("commandInput");

const sendButton =
    document.getElementById("sendButton");

const wakeButton =
    document.getElementById("wakeButton");

const stopButton =
    document.getElementById("stopButton");

const stopVoiceButton =
    document.getElementById("stopVoiceButton");

const log =
    document.getElementById("log");

const clearButton =
    document.getElementById("clearButton");

const commandCount =
    document.getElementById("commandCount");

const voiceProgress =
    document.getElementById("voiceProgress");

const neuralProgress =
    document.getElementById("neuralProgress");


/* -----------------------------
   VARIABLES
----------------------------- */

let recognition = null;

let listening = false;

let wakeMode = false;

let commands = 0;

let finalAlreadyExecuted = false;


/* =====================================================
   CLOCK
===================================================== */

function updateClock() {

    const now = new Date();

    document.getElementById("clock")
        .textContent =
        now.toLocaleTimeString();

}

setInterval(
    updateClock,
    1000
);

updateClock();


/* =====================================================
   PARTICLES
===================================================== */

const particles =
    document.getElementById("particles");

for (
    let i = 0;
    i < 35;
    i++
) {

    const p =
        document.createElement("div");

    p.className =
        "particle";

    p.style.left =
        Math.random() * 100 + "%";

    p.style.animationDuration =
        (8 + Math.random() * 15) + "s";

    p.style.animationDelay =
        Math.random() * 10 + "s";

    particles.appendChild(p);
}


/* =====================================================
   LOG
===================================================== */

function addLog(
    type,
    message
) {

    const line =
        document.createElement("div");

    line.className =
        "log-line";


    const time =
        new Date()
            .toLocaleTimeString();


    let cls =
        "log-system";


    if (type === "USER") {
        cls = "log-user";
    }

    if (type === "JARVIS") {
        cls = "log-jarvis";
    }


    line.innerHTML =
        `<span class="log-time">${time}</span>
         <span class="${cls}">${escapeHTML(message)}</span>`;


    log.prepend(line);

}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


/* =====================================================
   SPEECH SYNTHESIS
===================================================== */

function speak(
    text
) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.lang =
        "en-IN";

    utterance.rate =
        0.9;

    utterance.pitch =
        0.8;

    utterance.volume =
        1;


    utterance.onstart =
        function() {

            statusText.textContent =
                "SPEAKING";

        };


    utterance.onend =
        function() {

            if (!listening) {

                statusText.textContent =
                    "READY";

            }

        };


    speechSynthesis.speak(
        utterance
    );

}


/* =====================================================
   MICROPHONE SUPPORT
===================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";


    /*
     * Important:
     *
     * continuous = false
     *
     * This is more reliable on mobile.
     *
     * User taps SPEAK,
     * says command,
     * browser gives final result,
     * command executes immediately.
     */

    recognition.continuous =
        false;


    recognition.interimResults =
        true;


    recognition.maxAlternatives =
        1;


    recognition.onstart =
        function() {

            listening = true;

            finalAlreadyExecuted =
                false;


            document.body
                .classList
                .add("listening");


            micText.textContent =
                "LISTENING";


            micState.textContent =
                "● MIC ACTIVE";


            statusText.textContent =
                "LISTENING";


            recognitionState.textContent =
                "HEARING";


            transcriptText.textContent =
                "I'm listening...";


            addLog(
                "SYSTEM",
                "MICROPHONE ACTIVE"
            );

        };


    recognition.onresult =
        function(event) {

            let text = "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                text +=
                    event.results[i][0]
                        .transcript;

            }


            text =
                text.trim();


            if (text) {

                transcriptText.textContent =
                    text;

                animateWave();

            }


            /*
             * FINAL RESULT
             *
             * Automatically execute.
             *
             * No Execute button.
             */

            const result =
                event.results[
                    event.results.length - 1
                ];


            if (
                result.isFinal &&
                !finalAlreadyExecuted
            ) {

                finalAlreadyExecuted =
                    true;


                executeCommand(
                    text
                );

            }

        };


    recognition.onerror =
        function(event) {

            console.log(
                "Speech error:",
                event.error
            );


            listening = false;

            document.body
                .classList
                .remove("listening");


            micText.textContent =
                "SPEAK";


            micState.textContent =
                "● MIC OFF";


            statusText.textContent =
                "READY";


            recognitionState.textContent =
                "ERROR";


            if (
                event.error ===
                "not-allowed"
            ) {

                transcriptText.textContent =
                    "Microphone permission was denied. Allow microphone access in your browser settings.";

                addLog(
                    "SYSTEM",
                    "MICROPHONE PERMISSION DENIED"
                );

            } else if (
                event.error ===
                "no-speech"
            ) {

                transcriptText.textContent =
                    "I didn't hear anything. Tap SPEAK and try again.";

            } else {

                transcriptText.textContent =
                    "Voice error: " +
                    event.error;

            }

        };


    recognition.onend =
        function() {

            listening = false;


            document.body
                .classList
                .remove("listening");


            micText.textContent =
                "SPEAK";


            micState.textContent =
                "● MIC OFF";


            /*
             * If wake mode is enabled,
             * restart microphone after
             * the command has finished.
             */

            if (wakeMode) {

                setTimeout(
                    function() {

                        if (!listening) {

                            startListening();

                        }

                    },
                    700
                );

            } else {

                statusText.textContent =
                    "READY";

            }

        };

} else {

    /*
     * Browser does not support
     * SpeechRecognition.
     */

    micButton.disabled =
        true;

    micText.textContent =
        "NOT SUPPORTED";

    micState.textContent =
        "VOICE UNSUPPORTED";

    transcriptText.textContent =
        "Voice recognition is not supported by this browser. Try Safari or Chrome.";

    addLog(
        "SYSTEM",
        "SpeechRecognition API unavailable"
    );

}


/* =====================================================
   START MICROPHONE
===================================================== */

function startListening() {

    if (!recognition) {

        alert(
            "Voice recognition is not supported in this browser."
        );

        return;

    }


    /*
     * Stop existing recognition first.
     */

    try {

        recognition.stop();

    } catch (e) {}


    setTimeout(
        function() {

            try {

                recognition.start();

            } catch (error) {

                console.log(error);

            }

        },
        100
    );

}


/* =====================================================
   MIC BUTTON
===================================================== */

micButton.addEventListener(
    "click",
    function() {

        /*
         * If currently listening,
         * stop it.
         */

        if (listening) {

            stopListening();

            return;

        }


        /*
         * Start microphone.
         */

        startListening();

    }
);


/* =====================================================
   STOP MICROPHONE
===================================================== */

function stopListening() {

    wakeMode = false;

    wakeButton
        .classList
        .remove("active");

    wakeButton.textContent =
        "WAKE MODE: OFF";


    if (recognition) {

        try {

            recognition.stop();

        } catch (e) {}

    }


    listening = false;


    document.body
        .classList
        .remove("listening");


    micText.textContent =
        "SPEAK";


    micState.textContent =
        "● MIC OFF";


    statusText.textContent =
        "READY";

}


stopButton.addEventListener(
    "click",
    stopListening
);


/* =====================================================
   WAKE MODE
===================================================== */

wakeButton.addEventListener(
    "click",
    function() {

        wakeMode =
            !wakeMode;


        if (wakeMode) {

            wakeButton
                .classList
                .add("active");


            wakeButton.textContent =
                "WAKE MODE: ON";


            addLog(
                "SYSTEM",
                'WAKE MODE ON — SAY "JARVIS"'
            );


            transcriptText.textContent =
                'Wake mode active. Say "Jarvis" followed by a command.';


            startListening();

        } else {

            wakeButton
                .classList
                .remove("active");


            wakeButton.textContent =
                "WAKE MODE: OFF";


            stopListening();

        }

    }
);


/* =====================================================
   PROCESS VOICE
===================================================== */

function processVoiceCommand(
    text
) {

    let command =
        text.trim();


    /*
     * Remove "Jarvis" from beginning.
     */

    command =
        command.replace(
            /^(hey\s+)?jarvis[\s,]*/i,
            ""
        );


    /*
     * If wake mode and user only
     * said "Jarvis", answer.
     */

    if (!command) {

        speak(
            "Yes, I'm listening."
        );

        return;

    }


    executeCommand(
        command
    );

}


/* =====================================================
   COMMAND ENGINE
===================================================== */

function executeCommand(
    command
) {

    command =
        command.trim();


    if (!command) {
        return;
    }


    commands++;


    commandCount.textContent =
        commands;


    addLog(
        "USER",
        command
    );


    statusText.textContent =
        "PROCESSING";


    transcriptText.textContent =
        command;


    const lower =
        command.toLowerCase();


    /* -------------------------
       TIME
    ------------------------- */

    if (
        lower.includes("what time") ||
        lower === "time" ||
        lower.includes("current time")
    ) {

        const time =
            new Date()
                .toLocaleTimeString(
                    [],
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );


        respond(
            `The current time is ${time}.`
        );

        return;

    }


    /* -------------------------
       DATE
    ------------------------- */

    if (
        lower.includes("what date") ||
        lower.includes("today's date") ||
        lower.includes("todays date")
    ) {

        const date =
            new Date()
                .toLocaleDateString(
                    [],
                    {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    }
                );


        respond(
            `Today is ${date}.`
        );

        return;

    }


    /* -------------------------
       HELLO
    ------------------------- */

    if (
        lower === "hello" ||
        lower === "hi" ||
        lower === "hey"
    ) {

        respond(
            "Hello. JARVIS is online."
        );

        return;

    }


    /* -------------------------
       OPEN GOOGLE
    ------------------------- */

    if (
        lower === "open google" ||
        lower === "go to google"
    ) {

        navigate(
            "https://www.google.com",
            "Opening Google."
        );

        return;

    }


    /* -------------------------
       SEARCH
    ------------------------- */

    if (
        lower.startsWith("search ") ||
        lower.startsWith("search for ") ||
        lower.startsWith("look up ")
    ) {

        let query =
            command
                .replace(/^search for /i, "")
                .replace(/^search /i, "")
                .replace(/^look up /i, "")
                .trim();


        if (!query) {

            respond(
                "What should I search for?"
            );

            return;

        }


        const url =
            "https://www.google.com/search?q=" +
            encodeURIComponent(query);


        navigate(
            url,
            `Searching for ${query}.`
        );

        return;

    }


    /* -------------------------
       OPEN WEBSITE
    ------------------------- */

    if (
        lower.startsWith("open ") ||
        lower.startsWith("go to ") ||
        lower.startsWith("visit ")
    ) {

        let site =
            command
                .replace(/^open /i, "")
                .replace(/^go to /i, "")
                .replace(/^visit /i, "")
                .trim();


        openWebsite(
            site
        );

        return;

    }


    /* -------------------------
       STOP VOICE
    ------------------------- */

    if (
        lower.includes("stop talking") ||
        lower.includes("stop speaking") ||
        lower === "be quiet"
    ) {

        speechSynthesis.cancel();

        statusText.textContent =
            "READY";

        addLog(
            "JARVIS",
            "Voice output stopped."
        );

        return;

    }


    /* -------------------------
       UNKNOWN COMMAND
    ------------------------- */

    /*
     * If JARVIS doesn't know the command,
     * automatically search it.
     */

    const url =
        "https://www.google.com/search?q=" +
        encodeURIComponent(command);


    navigate(
        url,
        `I will search for ${command}.`
    );

}


/* =====================================================
   OPEN WEBSITE
===================================================== */

function openWebsite(
    site
) {

    /*
     * Remove spaces.
     */

    site =
        site.trim();


    /*
     * Common websites.
     */

    const websites = {

        "google":
            "https://www.google.com",

        "google.com":
            "https://www.google.com",

        "youtube":
            "https://www.youtube.com",

        "youtube.com":
            "https://www.youtube.com",

        "github":
            "https://github.com",

        "github.com":
            "https://github.com",

        "wikipedia":
            "https://www.wikipedia.org",

        "wikipedia.org":
            "https://www.wikipedia.org",

        "reddit":
            "https://www.reddit.com",

        "reddit.com":
            "https://www.reddit.com",

        "instagram":
            "https://www.instagram.com",

        "instagram.com":
            "https://www.instagram.com",

        "facebook":
            "https://www.facebook.com",

        "facebook.com":
            "https://www.facebook.com"

    };


    const key =
        site
            .toLowerCase()
            .replace(
                /\s/g,
                ""
            );


    if (websites[key]) {

        navigate(
            websites[key],
            `Opening ${site}.`
        );

        return;

    }


    /*
     * If user says:
     *
     * "open example.com"
     */

    let url =
        site;


    if (
        !/^https?:\/\//i.test(url)
    ) {

        url =
            "https://" + url;

    }


    /*
     * Check whether it looks
     * like a domain.
     */

    try {

        const parsed =
            new URL(url);


        if (
            parsed.hostname.includes(".")
        ) {

            navigate(
                url,
                `Opening ${site}.`
            );

            return;

        }

    } catch (e) {}


    /*
     * If not a website,
     * search for it.
     */

    const searchURL =
        "https://www.google.com/search?q=" +
        encodeURIComponent(site);


    navigate(
        searchURL,
        `Searching for ${site}.`
    );

}


/* =====================================================
   NAVIGATE
===================================================== */

function navigate(
    url,
    message
) {

    addLog(
        "JARVIS",
        message
    );


    transcriptText.textContent =
        message;


    statusText.textContent =
        "EXECUTING";


    voiceProgress.style.width =
        "100%";


    /*
     * Speak response.
     */

    speak(
        message
    );


    /*
     * AUTOMATIC NAVIGATION.
     *
     * No second click.
     */

    setTimeout(
        function() {

            window.location.href =
                url;

        },
        700
    );

}


/* =====================================================
   RESPOND
===================================================== */

function respond(
    message
) {

    addLog(
        "JARVIS",
        message
    );


    transcriptText.textContent =
        message;


    statusText.textContent =
        "SPEAKING";


    speak(
        message
    );


    setTimeout(
        function() {

            statusText.textContent =
                "READY";

            voiceProgress.style.width =
                "75%";

        },
        1200
    );

}


/* =====================================================
   MANUAL COMMAND
===================================================== */

function sendManualCommand() {

    const text =
        commandInput.value.trim();


    if (!text) {

        return;

    }


    commandInput.value =
        "";


    /*
     * Manual commands don't need
     * microphone or wake mode.
     */

    processVoiceCommand(
        text
    );

}


sendButton.addEventListener(
    "click",
    sendManualCommand
);


commandInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendManualCommand();

        }

    }
);


/* =====================================================
   STOP JARVIS SPEECH
===================================================== */

stopVoiceButton.addEventListener(
    "click",
    function() {

        if (
            "speechSynthesis" in window
        ) {

            speechSynthesis.cancel();

        }


        statusText.textContent =
            "READY";


        addLog(
            "SYSTEM",
            "JARVIS VOICE STOPPED"
        );

    }
);


/* =====================================================
   CLEAR LOG
===================================================== */

clearButton.addEventListener(
    "click",
    function() {

        log.innerHTML =
            "";

        addLog(
            "SYSTEM",
            "COMMAND STREAM CLEARED"
        );

    }
);


/* =====================================================
   WAVE ANIMATION
===================================================== */

function animateWave() {

    document
        .querySelectorAll("#wave i")
        .forEach(
            function(bar) {

                bar.style.height =
                    (
                        5 +
                        Math.random() * 30
                    ) + "px";

            }
        );

}


/* =====================================================
   TELEMETRY
===================================================== */

setInterval(
    function() {

        const value =
            80 +
            Math.floor(
                Math.random() * 19
            );


        neuralProgress.style.width =
            value + "%";


        document.getElementById(
            "neural"
        ).textContent =
            value + "%";

    },
    1200
);


/* =====================================================
   STARTUP
===================================================== */

addLog(
    "SYSTEM",
    "JARVIS CORE INITIALIZED"
);

addLog(
    "SYSTEM",
    "AUTOMATIC COMMAND EXECUTION ONLINE"
);

addLog(
    "SYSTEM",
    "WEB NAVIGATION ENGINE ONLINE"
);

addLog(
    "SYSTEM",
    "MANUAL COMMAND INTERFACE ONLINE"
);

if (recognition) {

    addLog(
        "SYSTEM",
        "VOICE RECOGNITION READY"
    );

} else {

    addLog(
        "SYSTEM",
        "VOICE RECOGNITION NOT AVAILABLE"
    );

}

addLog(
    "SYSTEM",
    "JARVIS READY"
);
